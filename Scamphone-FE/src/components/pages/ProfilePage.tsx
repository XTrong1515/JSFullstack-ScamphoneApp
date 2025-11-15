import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Loader2, Camera, Check } from 'lucide-react';
import { profileService, UserProfile } from '../../services/profileService';
import { ImageWithFallback } from '../figma/ImageWithFallback';

interface ProfilePageProps {
  onPageChange: (page: string) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
}

export function ProfilePage({ onPageChange, onUpdateProfile }: ProfilePageProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải thông tin người dùng');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const updatedProfile = await profileService.updateProfile({
        name: profile.name,
        phone: profile.phone,
        address: profile.address
      });
      
      setProfile(updatedProfile);
      if (onUpdateProfile) {
        onUpdateProfile(updatedProfile);
      }
      setSuccess('Cập nhật thông tin thành công');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật thông tin');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');
    setSuccess('');

    try {
      const { avatarUrl } = await profileService.uploadAvatar(file);
      setProfile(prev => prev ? { ...prev, avatar: avatarUrl } : null);
      setSuccess('Cập nhật ảnh đại diện thành công');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật ảnh đại diện');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      await profileService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setSuccess('Đổi mật khẩu thành công');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể đổi mật khẩu');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesChange = async (key: keyof UserProfile['preferences'], value: boolean) => {
    if (!profile) return;

    try {
      const updatedProfile = await profileService.updatePreferences({
        ...profile.preferences,
        [key]: value
      });
      setProfile(updatedProfile);
      setSuccess('Cập nhật tùy chọn thành công');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật tùy chọn');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto mt-8">
        <AlertDescription>Không thể tải thông tin người dùng</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-8">Thông tin tài khoản</h1>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Thông tin cá nhân</TabsTrigger>
          <TabsTrigger value="security">Bảo mật</TabsTrigger>
          <TabsTrigger value="preferences">Tùy chọn</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="p-6">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <ImageWithFallback
                    src={profile.avatar || '/default-avatar.png'}
                    alt={profile.name}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-blue-700"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </div>
                <div>
                  <h3 className="font-medium">{profile.name}</h3>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Họ tên</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Số điện thoại</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Địa chỉ</Label>
                  <Input
                    id="address"
                    value={profile.address}
                    onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-600">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="p-6">
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    currentPassword: e.target.value
                  })}
                  required
                />
              </div>

              <div>
                <Label htmlFor="newPassword">Mật khẩu mới</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    newPassword: e.target.value
                  })}
                  required
                  minLength={6}
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({
                    ...passwordForm,
                    confirmPassword: e.target.value
                  })}
                  required
                  minLength={6}
                />
              </div>

              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  'Đổi mật khẩu'
                )}
              </Button>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card className="p-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Thông báo</Label>
                  <p className="text-sm text-gray-500">
                    Nhận thông báo về đơn hàng và khuyến mãi
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.notifications}
                  onCheckedChange={(checked: boolean) => 
                    handlePreferencesChange('notifications', checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Đăng ký nhận tin</Label>
                  <p className="text-sm text-gray-500">
                    Nhận email về sản phẩm mới và ưu đãi đặc biệt
                  </p>
                </div>
                <Switch
                  checked={profile.preferences.newsletter}
                  onCheckedChange={(checked: boolean) => 
                    handlePreferencesChange('newsletter', checked)
                  }
                />
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}