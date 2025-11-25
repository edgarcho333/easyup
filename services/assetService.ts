
import { mockDb } from '../lib/mockDb';
import { IdeaAsset, AssetReview, AssetAnnotation } from '../types';

export const assetService = {
  async uploadAsset(
    ideaId: string, 
    file: File, 
    userId: string, 
    notes?: string
  ): Promise<IdeaAsset> {
    // 1. Determine version
    const existingAssets = mockDb.filter('idea_assets', (a: any) => a.idea_id === ideaId)
        .sort((a: any, b: any) => b.version_number - a.version_number);
    
    const nextVersion = existingAssets.length > 0 ? existingAssets[0].version_number + 1 : 1;

    // 2. Mock Upload (Use a fake URL based on file type)
    // In a real app, we'd use FileReader to show the actual image locally
    const publicUrl = file.type.startsWith('image') 
        ? URL.createObjectURL(file) 
        : 'https://via.placeholder.com/400x300?text=Video+Asset';

    // 3. Create Record
    return mockDb.insert('idea_assets', {
        idea_id: ideaId,
        file_url: publicUrl,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size,
        version_number: nextVersion,
        uploaded_by: userId,
        notes,
        status: 'pending_review'
    });
  },

  async getAssets(ideaId: string): Promise<IdeaAsset[]> {
    const assets = mockDb.filter('idea_assets', (a: any) => a.idea_id === ideaId);
    return assets.map((a: any) => ({
        ...a,
        uploader: mockDb.find('users', (u: any) => u.id === a.uploaded_by)
    })).sort((a: any, b: any) => b.version_number - a.version_number);
  },

  async reviewAsset(
    assetId: string,
    reviewerId: string,
    action: 'approved' | 'changes_requested' | 'rejected',
    comments?: string
  ): Promise<void> {
    
    mockDb.insert('asset_reviews', {
        asset_id: assetId,
        reviewer_id: reviewerId,
        action,
        comments
    });

    mockDb.update('idea_assets', assetId, { status: action });
  },

  async getAssetReviews(assetId: string): Promise<AssetReview[]> {
    const reviews = mockDb.filter('asset_reviews', (r: any) => r.asset_id === assetId);
    return reviews.map((r: any) => ({
        ...r,
        reviewer: mockDb.find('users', (u: any) => u.id === r.reviewer_id)
    })).sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // --- ANNOTATIONS ---
  
  async addAnnotation(assetId: string, userId: string, x: number, y: number, comment: string): Promise<AssetAnnotation> {
    const annotation = mockDb.insert<AssetAnnotation>('asset_annotations', {
      asset_id: assetId,
      user_id: userId,
      x,
      y,
      comment,
      is_resolved: false
    });
    
    const user = mockDb.find('users', (u: any) => u.id === userId);
    return { ...annotation, user };
  },

  async getAnnotations(assetId: string): Promise<AssetAnnotation[]> {
    const annotations = mockDb.filter('asset_annotations', (a: any) => a.asset_id === assetId);
    return annotations.map((a: any) => ({
      ...a,
      user: mockDb.find('users', (u: any) => u.id === a.user_id)
    })).sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async resolveAnnotation(annotationId: string): Promise<void> {
    mockDb.update('asset_annotations', annotationId, { is_resolved: true });
  },

  async deleteAnnotation(annotationId: string): Promise<void> {
    mockDb.delete('asset_annotations', annotationId);
  }
};
