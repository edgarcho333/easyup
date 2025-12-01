import { supabase } from '../lib/supabase';
import { IdeaAsset, AssetReview, AssetAnnotation } from '../types';

export const assetService = {
  async uploadAsset(
    ideaId: string,
    file: File,
    userId: string,
    notes?: string
  ): Promise<IdeaAsset> {
    // 1. Get current highest version
    const { data: existingAssets } = await supabase
      .from('idea_assets')
      .select('version_number')
      .eq('idea_id', ideaId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = existingAssets && existingAssets.length > 0
      ? existingAssets[0].version_number + 1
      : 1;

    // 2. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${ideaId}/${Date.now()}_v${nextVersion}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('idea-assets')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading file:', uploadError);
      throw new Error('Failed to upload file');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('idea-assets')
      .getPublicUrl(fileName);

    const publicUrl = urlData.publicUrl;

    // 3. Create asset record
    const { data: asset, error: insertError } = await supabase
      .from('idea_assets')
      .insert({
        idea_id: ideaId,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        version_number: nextVersion,
        uploaded_by: userId,
        notes: notes || null,
        status: 'pending_review'
      })
      .select()
      .single();

    if (insertError || !asset) {
      console.error('Error creating asset record:', insertError);
      throw new Error('Failed to create asset record');
    }

    return asset as IdeaAsset;
  },

  async getAssets(ideaId: string): Promise<IdeaAsset[]> {
    const { data, error } = await supabase
      .from('idea_assets')
      .select('*')
      .eq('idea_id', ideaId)
      .order('version_number', { ascending: false });

    if (error) {
      console.error('Error fetching assets:', error);
      return [];
    }

    // Fetch uploader info separately
    const assetsWithUploaders = await Promise.all(
      (data || []).map(async (a: any) => {
        let uploader;
        if (a.uploaded_by) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url')
            .eq('id', a.uploaded_by)
            .maybeSingle();
          uploader = userData || undefined;
        }

        return {
          id: a.id,
          idea_id: a.idea_id,
          file_url: a.file_url,
          file_name: a.file_name,
          file_type: a.file_type,
          file_size: a.file_size,
          version_number: a.version_number,
          status: a.status,
          uploaded_by: a.uploaded_by,
          notes: a.notes,
          created_at: a.created_at,
          uploader
        };
      })
    );

    return assetsWithUploaders;
  },

  async reviewAsset(
    assetId: string,
    reviewerId: string,
    action: 'approved' | 'changes_requested' | 'rejected',
    comments?: string
  ): Promise<void> {
    // Create review record
    const { error: reviewError } = await supabase
      .from('asset_reviews')
      .insert({
        asset_id: assetId,
        reviewer_id: reviewerId,
        action,
        comments: comments || null
      });

    if (reviewError) {
      console.error('Error creating review:', reviewError);
      throw reviewError;
    }

    // Update asset status
    const { error: updateError } = await supabase
      .from('idea_assets')
      .update({ status: action })
      .eq('id', assetId);

    if (updateError) {
      console.error('Error updating asset status:', updateError);
      throw updateError;
    }
  },

  async getAssetReviews(assetId: string): Promise<AssetReview[]> {
    const { data, error } = await supabase
      .from('asset_reviews')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }

    // Fetch reviewer info separately
    const reviewsWithReviewers = await Promise.all(
      (data || []).map(async (r: any) => {
        let reviewer;
        if (r.reviewer_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url')
            .eq('id', r.reviewer_id)
            .maybeSingle();
          reviewer = userData || undefined;
        }

        return {
          id: r.id,
          asset_id: r.asset_id,
          reviewer_id: r.reviewer_id,
          action: r.action,
          comments: r.comments,
          created_at: r.created_at,
          reviewer
        };
      })
    );

    return reviewsWithReviewers;
  },

  // --- ANNOTATIONS ---

  async addAnnotation(assetId: string, userId: string, x: number, y: number, comment: string): Promise<AssetAnnotation> {
    const { data, error } = await supabase
      .from('asset_annotations')
      .insert({
        asset_id: assetId,
        user_id: userId,
        x,
        y,
        comment,
        is_resolved: false
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Error adding annotation:', error);
      throw new Error('Failed to add annotation');
    }

    // Fetch user info
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, full_name, avatar_url')
      .eq('id', userId)
      .maybeSingle();

    return {
      id: data.id,
      asset_id: data.asset_id,
      user_id: data.user_id,
      x: data.x,
      y: data.y,
      comment: data.comment,
      is_resolved: data.is_resolved,
      created_at: data.created_at,
      user: userData || undefined
    };
  },

  async getAnnotations(assetId: string): Promise<AssetAnnotation[]> {
    const { data, error } = await supabase
      .from('asset_annotations')
      .select('*')
      .eq('asset_id', assetId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching annotations:', error);
      return [];
    }

    // Fetch user info for each annotation
    const annotationsWithUsers = await Promise.all(
      (data || []).map(async (a: any) => {
        let user;
        if (a.user_id) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, email, full_name, avatar_url')
            .eq('id', a.user_id)
            .maybeSingle();
          user = userData || undefined;
        }

        return {
          id: a.id,
          asset_id: a.asset_id,
          user_id: a.user_id,
          x: a.x,
          y: a.y,
          comment: a.comment,
          is_resolved: a.is_resolved,
          created_at: a.created_at,
          user
        };
      })
    );

    return annotationsWithUsers;
  },

  async resolveAnnotation(annotationId: string): Promise<void> {
    const { error } = await supabase
      .from('asset_annotations')
      .update({ is_resolved: true })
      .eq('id', annotationId);

    if (error) {
      console.error('Error resolving annotation:', error);
      throw error;
    }
  },

  async deleteAnnotation(annotationId: string): Promise<void> {
    const { error } = await supabase
      .from('asset_annotations')
      .delete()
      .eq('id', annotationId);

    if (error) {
      console.error('Error deleting annotation:', error);
      throw error;
    }
  }
};
