
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { userService } from '../../services/userService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Camera, 
  Mail, 
  Save, 
  Loader2, 
  Trash2, 
  LogOut,
  Check
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshProfile, logout } = useAuth();
  const { addToast } = useToast();
  
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isLoadingPassword, setIsLoadingPassword] = useState(false);

  // Profile State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences State (Mock)
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(false);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setEmail(user.email);
      setAvatarUrl(user.avatar_url || '');
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);
      // Create preview
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoadingProfile(true);

    try {
      // In a real app, upload avatarFile to storage first
      await userService.updateProfile(user.id, {
        full_name: fullName,
        avatar_url: avatarUrl
      });
      
      await refreshProfile();
      addToast('Profile updated successfully', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to update profile', 'error');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      addToast("New passwords don't match", 'error');
      return;
    }

    if (newPassword.length < 8) {
      addToast("Password must be at least 8 characters", 'error');
      return;
    }

    setIsLoadingPassword(true);
    try {
      await userService.changePassword(user.id, currentPassword, newPassword);
      addToast('Password changed successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast(err.message || 'Failed to change password', 'error');
    } finally {
      setIsLoadingPassword(false);
    }
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500 mt-1">Manage your profile details and security preferences.</p>
        </div>
        <Button variant="outline" onClick={handleLogout} className="text-slate-600 hover:text-red-600 hover:bg-red-50 border-slate-200">
          <LogOut className="h-4 w-4 mr-2" /> Sign out
        </Button>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" /> Public Profile
          </CardTitle>
          <CardDescription>This information will be displayed to other team members.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="flex flex-col md:flex-row gap-8">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600 text-4xl font-bold">
                      {fullName?.[0]}
                    </div>
                  )}
                </div>
                <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="h-8 w-8 text-white" />
                </label>
                <input 
                  id="avatar-upload" 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
              <p className="text-xs text-slate-500">Allowed *.jpeg, *.jpg, *.png, *.gif</p>
            </div>

            {/* Inputs */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <Input 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input 
                      className="pl-9 bg-slate-50 text-slate-500" 
                      value={email} 
                      readOnly 
                      disabled
                    />
                  </div>
                  <p className="text-[10px] text-slate-400">Contact support to change email.</p>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" isLoading={isLoadingProfile}>
                  <Save className="h-4 w-4 mr-2" /> Save Changes
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" /> Security & Password
          </CardTitle>
          <CardDescription>Ensure your account is secure by using a strong password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4 max-w-2xl">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Current Password</label>
              <Input 
                type="password" 
                value={currentPassword} 
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">New Password</label>
                <Input 
                  type="password" 
                  value={newPassword} 
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Confirm New Password</label>
                <Input 
                  type="password" 
                  value={confirmPassword} 
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button variant="outline" type="submit" isLoading={isLoadingPassword} disabled={!currentPassword || !newPassword}>
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-500" /> Notifications
          </CardTitle>
          <CardDescription>Choose how you want to be notified about project updates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 divide-y divide-slate-100">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-slate-900">Email Notifications</p>
                <p className="text-xs text-slate-500">Receive emails about task assignments and approvals.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={emailNotifs} onChange={e => setEmailNotifs(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-slate-900">Browser Push Notifications</p>
                <p className="text-xs text-slate-500">Get real-time popups when you are online.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={pushNotifs} onChange={e => setPushNotifs(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between py-4">
              <div>
                <p className="font-medium text-slate-900">Marketing & Tips</p>
                <p className="text-xs text-slate-500">Receive news about new features and tips.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={marketingEmails} onChange={e => setMarketingEmails(e.target.checked)} />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-100 overflow-hidden">
        <CardHeader className="bg-red-50/50 border-b border-red-100">
          <CardTitle className="flex items-center gap-2 text-red-700">
            <Lock className="h-5 w-5" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-900">Delete Account</p>
              <p className="text-sm text-slate-500">Permanently remove your account and all of its data.</p>
            </div>
            <Button variant="destructive" onClick={() => addToast('Account deletion is disabled for demo users.', 'info')}>
              <Trash2 className="h-4 w-4 mr-2" /> Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
