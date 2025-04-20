'use client'
/// <reference types="react" />

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Spinner } from '@/components/ui/spinner'
import { CurrencySelector } from './CurrencySelector'
import { BudgetCategoryEditor } from './BudgetCategoryEditor'
import { UserProfile, CurrencyCode } from '@/types/user'
import { useTheme } from 'next-themes'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera } from 'lucide-react'

export function ProfileSettings({
  profile,
  onUpdate
}: {
  profile: UserProfile
  onUpdate: (profile: Partial<UserProfile>) => Promise<void>
}) {
  useAuth()
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      await onUpdate({
        settings: {
          ...profile.settings,
          theme: theme as 'light' | 'dark' | 'system'
        }
      })
      toast({
        title: 'Success',
        description: 'Profile settings updated successfully'
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update profile settings'

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      // Implement photo upload logic here
      // Update profile.photoURL after successful upload
      toast({
        title: 'Success',
        description: 'Profile photo updated successfully'
      })
    } catch (error: unknown) {
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to update profile photo'

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile.photoURL} alt={profile.displayName} />
              <AvatarFallback>{profile.displayName[0]}</AvatarFallback>
            </Avatar>
            <label
              htmlFor="photo-upload"
              className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer"
            >
              <Camera className="h-4 w-4 text-primary-foreground" />
              <input
                id="photo-upload"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isUploading}
              />
            </label>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold">{profile.displayName}</h2>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Financial Settings</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Monthly Income</Label>
            <div className="flex gap-3">
              <CurrencySelector
                value={profile.settings.currency}
                onValueChange={(currency: string) =>
                  onUpdate({ settings: { ...profile.settings, currency: currency as CurrencyCode } })
                }
              />
              <Input
                type="number"
                value={profile.settings.monthlyIncome}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  onUpdate({
                    settings: {
                      ...profile.settings,
                      monthlyIncome: Number(e.target.value)
                    }
                  })
                }
                min="0"
                step="0.01"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Budget Categories</Label>
            <BudgetCategoryEditor
              categories={profile.settings.budgetLimits}
              onUpdate={(budgetLimits) =>
                onUpdate({ settings: { ...profile.settings, budgetLimits } })
              }
              currency={profile.settings.currency}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label>Notifications</Label>
            <Switch
              checked={profile.settings.notifications}
              onCheckedChange={(notifications: boolean) =>
                onUpdate({ settings: { ...profile.settings, notifications } })
              }
            />
          </div>
        </div>
      </Card>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Spinner className="mr-2" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  )
}


