import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { FeatureFlagProvider } from '@/lib/FeatureFlagContext';
import FeatureGate from '@/components/dashboard/FeatureGate';
import LoginPage from '@/components/auth/LoginPage';
import ProtectedRoute from '@/components/ProtectedRoute';

// Page imports
import Landing from '@/pages/Landing';
import Programs from '@/pages/Programs';
import Onboarding from '@/pages/Onboarding';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import DashboardHome from '@/pages/dashboard/DashboardHome';
import MealTracker from '@/pages/dashboard/MealTracker';
import WaterTracker from '@/pages/dashboard/WaterTracker';
import StepTracker from '@/pages/dashboard/StepTracker';
import WorkoutTracker from '@/pages/dashboard/WorkoutTracker';
import SleepTracker from '@/pages/dashboard/SleepTracker';
import AITools from '@/pages/dashboard/AITools';
import Achievements from '@/pages/dashboard/Achievements';
import Analytics from '@/pages/dashboard/Analytics';
import CoachPlan from '@/pages/dashboard/CoachPlan';
import DashboardSettings from '@/pages/dashboard/DashboardSettings';
import HealthyRecipes from '@/pages/dashboard/HealthyRecipes';
import SmartFitAI from '@/pages/dashboard/SmartFitAI';
import ReadinessScore from '@/pages/dashboard/ReadinessScore';
import DailyMissions from '@/pages/dashboard/DailyMissions';
import TransformationJourney from '@/pages/dashboard/TransformationJourney';
import WeeklyReport from '@/pages/dashboard/WeeklyReport';
import FoodCamera from '@/pages/dashboard/FoodCamera';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminOverview from '@/pages/admin/AdminOverview';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminUserDetail from '@/pages/admin/AdminUserDetail';
import AdminAnalytics from '@/pages/admin/AdminAnalytics';
import AdminPlans from '@/pages/admin/AdminPlans';
import AdminAIInsights from '@/pages/admin/AdminAIInsights';
import AdminRisk from '@/pages/admin/AdminRisk';
import AdminRevenue from '@/pages/admin/AdminRevenue';
import AdminMessages from '@/pages/admin/AdminMessages';
import AdminTasks from '@/pages/admin/AdminTasks';
import AdminChallenges from '@/pages/admin/AdminChallenges';
import AdminLiveFeed from '@/pages/admin/AdminLiveFeed';
import AdminAutomations from '@/pages/admin/AdminAutomations';
import AdminFeatureFlags from '@/pages/admin/AdminFeatureFlags';
import AdminUserAccess from '@/pages/admin/AdminUserAccess';
import SupplementTracker from '@/pages/dashboard/SupplementTracker';
import WeightManagement from '@/pages/dashboard/WeightManagement';
import GroceryListPage from '@/pages/dashboard/GroceryList';
import Messages from '@/pages/dashboard/Messages';
import BodyProgressTracker from '@/pages/dashboard/BodyProgressTracker';
import Profile from '@/pages/dashboard/Profile';
import AdminRecipes from '@/pages/admin/cms/AdminRecipes';
import AdminExercises from '@/pages/admin/cms/AdminExercises';
import AdminWorkoutPlans from '@/pages/admin/cms/AdminWorkoutPlans';
import AdminFoodDatabase from '@/pages/admin/cms/AdminFoodDatabase';
import AdminPrograms from '@/pages/admin/cms/AdminPrograms';
import AdminBlog from '@/pages/admin/cms/AdminBlog';
import AdminTestimonials from '@/pages/admin/cms/AdminTestimonials';
import AdminAchievementsMissions from '@/pages/admin/AdminAchievementsMissions';
import Payment from '@/pages/Payment';
import PaymentSuccess from '@/pages/PaymentSuccess';
import Blog from '@/pages/Blog';
import BlogPostPage from '@/pages/BlogPost';
import AdminSetupPage from '@/pages/admin/Adminsetup';

const AuthenticatedApp = () => {
  const { isLoadingAuth } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <span className="text-sm text-muted-foreground">Loading FitElite...</span>
        </div>
      </div>
    );
  }

  return (
    <FeatureFlagProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin-setup" element={<AdminSetupPage />} />
        <Route path="/programs" element={<Programs />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<BlogPostPage />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />


        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="meals" element={<FeatureGate featureId="meals"><MealTracker /></FeatureGate>} />
          <Route path="water" element={<FeatureGate featureId="water"><WaterTracker /></FeatureGate>} />
          <Route path="steps" element={<FeatureGate featureId="steps"><StepTracker /></FeatureGate>} />
          <Route path="workouts" element={<FeatureGate featureId="workouts"><WorkoutTracker /></FeatureGate>} />
          <Route path="sleep" element={<FeatureGate featureId="sleep"><SleepTracker /></FeatureGate>} />
          <Route path="ai-tools" element={<FeatureGate featureId="ai_tools"><AITools /></FeatureGate>} />
          <Route path="achievements" element={<FeatureGate featureId="achievements"><Achievements /></FeatureGate>} />
          <Route path="analytics" element={<FeatureGate featureId="analytics"><Analytics /></FeatureGate>} />
          <Route path="coach-plan" element={<FeatureGate featureId="coach_plan"><CoachPlan /></FeatureGate>} />
          <Route path="recipes" element={<FeatureGate featureId="recipes"><HealthyRecipes /></FeatureGate>} />
          <Route path="smart-fit" element={<FeatureGate featureId="smart_fit"><SmartFitAI /></FeatureGate>} />
          <Route path="readiness" element={<FeatureGate featureId="readiness"><ReadinessScore /></FeatureGate>} />
          <Route path="missions" element={<FeatureGate featureId="missions"><DailyMissions /></FeatureGate>} />
          <Route path="journey" element={<FeatureGate featureId="journey"><TransformationJourney /></FeatureGate>} />
          <Route path="weekly-report" element={<FeatureGate featureId="weekly_report"><WeeklyReport /></FeatureGate>} />
          <Route path="food-camera" element={<FeatureGate featureId="food_camera"><FoodCamera /></FeatureGate>} />
          <Route path="supplements" element={<FeatureGate featureId="supplements"><SupplementTracker /></FeatureGate>} />
          <Route path="grocery" element={<FeatureGate featureId="grocery"><GroceryListPage /></FeatureGate>} />
          <Route path="weight" element={<FeatureGate featureId="weight"><WeightManagement /></FeatureGate>} />
          <Route path="messages" element={<Messages />} />
          <Route path="body-progress" element={<BodyProgressTracker />} />
          <Route path="profile" element={<Profile />} />
          <Route path="settings" element={<DashboardSettings />} />
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="user/:id" element={<AdminUserDetail />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="plans" element={<AdminPlans />} />
          <Route path="ai-insights" element={<AdminAIInsights />} />
          <Route path="risk" element={<AdminRisk />} />
          <Route path="revenue" element={<AdminRevenue />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="tasks" element={<AdminTasks />} />
          <Route path="challenges" element={<AdminChallenges />} />
          <Route path="live-feed" element={<AdminLiveFeed />} />
          <Route path="automations" element={<AdminAutomations />} />
          <Route path="features" element={<AdminFeatureFlags />} />
          <Route path="access-control" element={<AdminUserAccess />} />
          <Route path="cms/recipes" element={<AdminRecipes />} />
          <Route path="cms/exercises" element={<AdminExercises />} />
          <Route path="cms/workouts" element={<AdminWorkoutPlans />} />
          <Route path="cms/food" element={<AdminFoodDatabase />} />
          <Route path="cms/programs" element={<AdminPrograms />} />
          <Route path="cms/blog" element={<AdminBlog />} />
          <Route path="cms/testimonials" element={<AdminTestimonials />} />
          <Route path="gamification" element={<AdminAchievementsMissions />} />
        </Route>

        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </FeatureFlagProvider>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
        <SonnerToaster position="top-right" theme="dark" />
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App


