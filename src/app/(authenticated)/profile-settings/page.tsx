'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/lib/toast'
import { doc, updateDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { CurrencyCode, UserSettings, BudgetLimit } from '@/types/user'
import { Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'
import { NotificationType } from '@/lib/services/notification-service'

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { notifyBudget } = useNotification()
  const [isNewUser, setIsNewUser] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [settings, setSettings] = useState<UserSettings>({
    monthlyBudget: 0,
    currency: 'PHP' as CurrencyCode,
    budgetLimits: {
      food_dining: 0,
      transportation: 0,
      bills_utilities: 0,
      groceries: 0,
      entertainment: 0,
      healthcare: 0,
      shopping: 0,
      others: 0
    },
    notifications: true,
    theme: 'system'
  })

  // Default settings to use when user settings are missing or invalid
  const defaultSettings: UserSettings = {
    monthlyBudget: 0,
    currency: 'PHP' as CurrencyCode,
    budgetLimits: {
      food_dining: 0,
      transportation: 0,
      bills_utilities: 0,
      groceries: 0,
      entertainment: 0,
      healthcare: 0,
      shopping: 0,
      others: 0
    },
    notifications: true,
    theme: 'system'
  }

  // Check if user is new (has default values)
  useEffect(() => {
    if (user) {
      console.log('User profile loaded:', user)

      try {
        // Make sure user.settings exists and has the expected structure
        if (user.settings) {
          // Ensure all required properties exist
          const safeSettings = {
            ...defaultSettings,
            ...user.settings,
            budgetLimits: {
              ...defaultSettings.budgetLimits,
              ...(user.settings.budgetLimits || {})
            }
          }

          // Only update settings if they haven't been modified yet
          // This prevents overwriting user's unsaved changes when auth state refreshes
          setSettings(prev => {
            // If this is the initial load (default values) or we're loading a different user
            if (prev.monthlyBudget === defaultSettings.monthlyBudget &&
              Object.values(prev.budgetLimits).every(val => val === 0)) {
              return safeSettings;
            }
            // Otherwise keep the current state to preserve unsaved changes
            return prev;
          })

          // Check if this is a new user (budget values are 0)
          const isNewUserCheck = safeSettings.monthlyBudget === 0 &&
            Object.values(safeSettings.budgetLimits).every(val => val === 0)
          setIsNewUser(isNewUserCheck)
          console.log('Is new user:', isNewUserCheck)
        } else {
          console.error('User settings not found:', user)
          // Use default settings if user.settings is missing
          setSettings(defaultSettings)
          setIsNewUser(true)
        }
      } catch (error) {
        console.error('Error processing user settings:', error)
        toast({
          title: "Error",
          description: "There was a problem loading your profile. Using default settings.",
          variant: "destructive"
        })

        // Fall back to default settings
        setSettings(defaultSettings)
        setIsNewUser(true)
      }
    }
  }, [user, toast])

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [loading, user, router])

  const handleSave = async () => {
    if (!user) {
      console.error('Cannot save settings: User is not authenticated')
      await toast({
        title: "Error",
        description: "You must be logged in to save settings.",
        variant: "destructive"
      })
      return
    }

    // Ensure settings object is valid before saving
    if (!settings || !settings.budgetLimits) {
      console.error('Cannot save settings: Invalid settings object', settings)
      await toast({
        title: "Error",
        description: "There was a problem with your settings. Please try again.",
        variant: "destructive"
      })
      return
    }

    // Validate monthly budget for new users
    if (isNewUser && settings.monthlyBudget === 0) {
      await toast({
        title: "Validation Error",
        description: "Please enter a monthly budget greater than zero.",
        variant: "destructive"
      })
      return
    }

    // Calculate total budget limits
    const totalBudgetLimits = calculateTotalBudgetLimits(settings.budgetLimits)

    // Check if all budget limits are zero for new users
    if (isNewUser && totalBudgetLimits === 0) {
      await toast({
        title: "Validation Error",
        description: "Please set at least one category budget before continuing.",
        variant: "destructive"
      })
      return
    }

    // Check if total budget limits exceed monthly budget
    if (totalBudgetLimits > settings.monthlyBudget && settings.monthlyBudget > 0) {
      // Show a warning but allow saving
      await toast({
        title: "Budget Warning",
        description: `The sum of your category budgets (${formatCurrency(totalBudgetLimits, settings.currency)}) exceeds your monthly budget (${formatCurrency(settings.monthlyBudget, settings.currency)}).
        You can still save, but consider adjusting your category budgets.`,
        variant: "destructive"
      })
    }

    setIsSaving(true)
    console.log('Saving settings:', settings)

    try {
      // Prepare the user document reference
      const userDocRef = doc(db, 'users', user.uid)
      console.log('Document path:', userDocRef.path)

      // Ensure we're saving a complete settings object
      const settingsToSave = {
        ...defaultSettings,
        ...settings,
        budgetLimits: {
          ...defaultSettings.budgetLimits,
          ...(settings.budgetLimits || {})
        }
      }

      try {
        // First try to update the document
        await updateDoc(userDocRef, {
          'settings': settingsToSave
        })
      } catch (error) {
        // Type the error properly
        const updateError = error as { code?: string; message?: string }
        console.log('Update failed, trying to create document:', updateError)

        // If update fails because document doesn't exist, create it
        if (updateError.code === 'not-found' ||
          (updateError.message && updateError.message.includes('No document to update'))) {

          // Create a complete user document
          const userDoc = {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || '',
            photoURL: user.photoURL || '',
            createdAt: new Date().toISOString(),
            settings: settingsToSave
          }

          // Set the document with merge option to avoid overwriting existing data
          await setDoc(userDocRef, userDoc)
          console.log('Created new user document')
        } else {
          // If it's a different error, rethrow it
          throw updateError
        }
      }

      console.log('Settings saved successfully')

      // Update the user object with the new settings to ensure they're reflected across the app
      if (user) {
        user.settings = settingsToSave
      }

      // Create a notification for the budget update
      const title = isNewUser ? 'Budget Created' : 'Budget Updated'
      const message = `Your monthly budget of ${formatCurrency(settings.monthlyBudget, settings.currency)} has been ${isNewUser ? 'set' : 'updated'}.`

      // Show toast notification (which will also create a notification)
      await toast({
        title: "Settings saved",
        description: "Your profile settings have been updated successfully.",
      })

      // If this was a new user, redirect to dashboard
      if (isNewUser) {
        console.log('Redirecting new user to dashboard')
        router.push('/dashboard')
      }

    } catch (error) {
      // Type the error properly
      const err = error as { message?: string }
      console.error('Error saving settings:', err)
      await toast({
        title: "Error",
        description: err.message || "Failed to save settings. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle input changes
  const handleInputChange = (field: keyof UserSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Calculate total budget limits
  const calculateTotalBudgetLimits = (budgetLimits: Record<BudgetLimit, number>) => {
    return Object.values(budgetLimits).reduce((sum, value) => sum + (value || 0), 0)
  }

  // Handle budget limit changes
  const handleBudgetLimitChange = (category: BudgetLimit, value: string) => {
    const numValue = parseFloat(value) || 0

    setSettings(prev => {
      // Create the updated budget limits
      const updatedBudgetLimits = {
        ...prev.budgetLimits,
        [category]: numValue
      }

      // Calculate the new total
      const totalBudgetLimits = calculateTotalBudgetLimits(updatedBudgetLimits)

      // If total exceeds monthly budget, show a warning toast
      if (totalBudgetLimits > prev.monthlyBudget && prev.monthlyBudget > 0) {
        // We'll use a non-async call here to avoid complicating the state update
        toast({
          title: "Budget Warning",
          description: `The sum of your category budgets (${formatCurrency(totalBudgetLimits, prev.currency)}) exceeds your monthly budget (${formatCurrency(prev.monthlyBudget, prev.currency)}).`,
          variant: "destructive"
        })
      }

      return {
        ...prev,
        budgetLimits: updatedBudgetLimits
      }
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{isNewUser ? 'Welcome to TrackXpense' : 'Profile Settings'}</h1>

        {!isNewUser && (
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            Manage your profile and budget preferences.
          </p>
        )}

        {isNewUser && (
          <div className="mt-4 p-4 md:p-5 bg-card border border-border rounded-lg shadow-sm">
            <div className="flex items-start">
              <div className="flex-shrink-0 bg-primary/10 rounded-full p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base md:text-lg font-semibold text-foreground">Complete Your Profile</h3>
                <p className="mt-1 text-sm md:text-base text-muted-foreground">
                  Set up your budget preferences to start tracking your expenses effectively.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Tabs defaultValue="budget" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="budget">Budget Settings</TabsTrigger>
          <TabsTrigger value="categories">Category Budgets</TabsTrigger>
        </TabsList>

        <TabsContent value="budget" className="space-y-4 mt-4">
          <Card className="relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-blue-500/10 to-blue-500/5 hover:from-blue-500/15 hover:to-blue-500/5 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">{isNewUser ? 'Monthly Budget' : 'Budget Information'}</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Set your monthly budget and preferred currency.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1 md:space-y-2">
                  <Label htmlFor="monthlyBudget" className="text-xs md:text-sm">Monthly Budget</Label>
                  <Input
                    id="monthlyBudget"
                    type="number"
                    value={settings.monthlyBudget === 0 ? '' : settings.monthlyBudget}
                    onChange={(e) => handleInputChange('monthlyBudget', parseFloat(e.target.value) || 0)}
                    placeholder="Enter your monthly budget"
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                </div>
              </div>

              <div className="space-y-1 md:space-y-2">
                <Label htmlFor="currency" className="text-xs md:text-sm">Currency</Label>
                <Select
                  value={settings.currency}
                  onValueChange={(value) => handleInputChange('currency', value as CurrencyCode)}
                >
                  <SelectTrigger id="currency" className="text-sm md:text-base h-9 md:h-10">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent className="text-xs md:text-sm">
                    <SelectItem value="PHP" className="text-xs md:text-sm">PHP - Philippine Peso</SelectItem>
                    <SelectItem value="USD" className="text-xs md:text-sm">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR" className="text-xs md:text-sm">EUR - Euro</SelectItem>
                    <SelectItem value="GBP" className="text-xs md:text-sm">GBP - British Pound</SelectItem>
                    <SelectItem value="JPY" className="text-xs md:text-sm">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="CAD" className="text-xs md:text-sm">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD" className="text-xs md:text-sm">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="CNY" className="text-xs md:text-sm">CNY - Chinese Yuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-4">
          <Card className="relative overflow-hidden transition-all duration-300 bg-gradient-to-br from-violet-500/10 to-violet-500/5 hover:from-violet-500/15 hover:to-violet-500/5 backdrop-blur-sm border-0">
            <CardHeader>
              <CardTitle className="text-base md:text-lg">{isNewUser ? 'Category Budgets' : 'Category Budgets'}</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Set budget limits for each spending category.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(settings.budgetLimits || {}).map(([category, amount]) => {
                  // Convert category_name to Category Name format
                  const displayName = category
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ');

                  return (
                    <div key={category} className="space-y-1 md:space-y-2">
                      <Label htmlFor={`budget-${category}`} className="text-xs md:text-sm">{displayName}</Label>
                      <Input
                        id={`budget-${category}`}
                        type="number"
                        value={amount === 0 ? '' : amount}
                        onChange={(e) => handleBudgetLimitChange(category as BudgetLimit, e.target.value)}
                        placeholder={`Enter budget for ${displayName}`}
                        className="text-sm md:text-base h-9 md:h-10"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3">
        {!isNewUser && (
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            disabled={isSaving}
            className="w-full md:w-auto"
          >
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className={`w-full ${isNewUser ? 'bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm md:text-base py-5 shadow-md transition-all duration-200' : 'md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground'}`}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            isNewUser ? 'Continue to Dashboard' : 'Save Changes'
          )}
        </Button>
      </div>
    </div>
  )
}
