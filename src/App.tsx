import { lazy, Suspense } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
const Auth = lazy(() => import("./pages/Auth"));
const Register = lazy(() => import("./pages/Register"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Articles = lazy(() => import("./pages/Articles"));
const News = lazy(() => import("./pages/News"));
const Writers = lazy(() => import("./pages/Writers"));
const AudioEpisodes = lazy(() => import("./pages/AudioEpisodes"));
const NumbersArchive = lazy(() => import("./pages/NumbersArchive"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const NewsDetail = lazy(() => import("./pages/NewsDetail"));
const WriterDetail = lazy(() => import("./pages/WriterDetail"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Products = lazy(() => import("./pages/Products"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const ManageArticles = lazy(() => import("./pages/admin/ManageArticles"));
const ManageNews = lazy(() => import("./pages/admin/ManageNews"));
const ManageWriters = lazy(() => import("./pages/admin/ManageWriters"));
const ManageProducts = lazy(() => import("./pages/admin/ManageProducts"));
const ManageUsers = lazy(() => import("./pages/admin/ManageUsers"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const Setup = lazy(() => import("./pages/Setup"));
import AdminLayout from "./components/AdminLayout";
import WriterLayout from "./components/WriterLayout";
const WriterDashboard = lazy(() => import("./pages/writer/Dashboard"));
const WriterManageArticles = lazy(() => import("./pages/writer/ManageArticles"));
const WriterManageNews = lazy(() => import("./pages/writer/ManageNews"));
const WriterProfile = lazy(() => import("./pages/writer/Profile"));
const WriterAddEditArticle = lazy(() => import("./pages/writer/AddEditArticle"));
const WriterAddEditNews = lazy(() => import("./pages/writer/AddEditNews"));
const WriterPreviewArticle = lazy(() => import("./pages/writer/PreviewArticle"));
const WriterPreviewNews = lazy(() => import("./pages/writer/PreviewNews"));
const WriterSettings = lazy(() => import("./pages/writer/Settings"));
const AdminAddEditProduct = lazy(() => import("./pages/admin/AddEditProduct"));
const ManageStoreProducts = lazy(() => import("./pages/admin/ManageStoreProducts"));
const AddEditStoreProduct = lazy(() => import("./pages/admin/AddEditStoreProduct"));
const ManageProductRequests = lazy(() => import("./pages/admin/ManageProductRequests"));
const Store = lazy(() => import("./pages/Store"));
const StoreProductDetail = lazy(() => import("./pages/StoreProductDetail"));
const AdminPreviewArticle = lazy(() => import("./pages/admin/PreviewArticle"));
const AdminPreviewNews = lazy(() => import("./pages/admin/PreviewNews"));
const AdminEditArticle = lazy(() => import("./pages/admin/AddEditArticle"));
const AdminEditNews = lazy(() => import("./pages/admin/AddEditNews"));
const ManageCategories = lazy(() => import("./pages/admin/ManageCategories"));
const ManageDailyStories = lazy(() => import("./pages/admin/ManageDailyStories"));
const ManageAudienceQuestions = lazy(() => import("./pages/admin/ManageAudienceQuestions"));
const ManageServiceRequests = lazy(() => import("./pages/admin/ManageServiceRequests"));
const ManageTimelines = lazy(() => import("./pages/admin/ManageTimelines"));
const ManageNumberStories = lazy(() => import("./pages/admin/ManageNumberStories"));
const ManageAudioEpisodes = lazy(() => import("./pages/admin/ManageAudioEpisodes"));
const ManageQuoteCards = lazy(() => import("./pages/admin/ManageQuoteCards"));
const WriterQuoteCards = lazy(() => import("./pages/writer/QuoteCards"));
const NotFound = lazy(() => import("./pages/NotFound"));



const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} disableTransitionOnChange>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="جاري التحميل"><span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-accent" /></div>}>
        <Routes>
          <Route path="/" element={<Index />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/writers" element={<Writers />} />
          <Route path="/audio" element={<AudioEpisodes />} />
          <Route path="/numbers" element={<NumbersArchive />} />
          <Route path="/writers/:id" element={<WriterDetail />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          
          <Route path="/store" element={<Store />} />
          <Route path="/store/:id" element={<StoreProductDetail />} />
          <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
          <Route path="/admin/articles" element={<AdminLayout><ManageArticles /></AdminLayout>} />
          <Route path="/admin/articles/preview/:id" element={<AdminLayout><AdminPreviewArticle /></AdminLayout>} />
          <Route path="/admin/articles/edit/:id" element={<AdminLayout><AdminEditArticle /></AdminLayout>} />
          <Route path="/admin/news" element={<AdminLayout><ManageNews /></AdminLayout>} />
          <Route path="/admin/news/preview/:id" element={<AdminLayout><AdminPreviewNews /></AdminLayout>} />
          <Route path="/admin/news/edit/:id" element={<AdminLayout><AdminEditNews /></AdminLayout>} />
          <Route path="/admin/writers" element={<AdminLayout><ManageWriters /></AdminLayout>} />
          <Route path="/admin/products" element={<AdminLayout><ManageProducts /></AdminLayout>} />
          <Route path="/admin/products/add" element={<AdminLayout><AdminAddEditProduct /></AdminLayout>} />
          <Route path="/admin/products/edit/:id" element={<AdminLayout><AdminAddEditProduct /></AdminLayout>} />
          <Route path="/admin/categories" element={<AdminLayout><ManageCategories /></AdminLayout>} />
          <Route path="/admin/daily-stories" element={<AdminLayout><ManageDailyStories /></AdminLayout>} />
          <Route path="/admin/questions" element={<AdminLayout><ManageAudienceQuestions /></AdminLayout>} />
          <Route path="/admin/service-requests" element={<AdminLayout><ManageServiceRequests /></AdminLayout>} />
          <Route path="/admin/timelines" element={<AdminLayout><ManageTimelines /></AdminLayout>} />
          <Route path="/admin/numbers" element={<AdminLayout><ManageNumberStories /></AdminLayout>} />
          <Route path="/admin/audio" element={<AdminLayout><ManageAudioEpisodes /></AdminLayout>} />
          <Route path="/admin/store" element={<AdminLayout><ManageStoreProducts /></AdminLayout>} />

          <Route path="/admin/store/add" element={<AdminLayout><AddEditStoreProduct /></AdminLayout>} />
          <Route path="/admin/store/edit/:id" element={<AdminLayout><AddEditStoreProduct /></AdminLayout>} />
          <Route path="/admin/store/requests" element={<AdminLayout><ManageProductRequests /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><ManageUsers /></AdminLayout>} />
          <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
          <Route path="/writer" element={<WriterLayout><WriterDashboard /></WriterLayout>} />
          <Route path="/writer/articles" element={<WriterLayout><WriterManageArticles /></WriterLayout>} />
          <Route path="/writer/articles/add" element={<WriterLayout><WriterAddEditArticle /></WriterLayout>} />
          <Route path="/writer/articles/edit/:id" element={<WriterLayout><WriterAddEditArticle /></WriterLayout>} />
          <Route path="/writer/articles/preview/:id" element={<WriterLayout><WriterPreviewArticle /></WriterLayout>} />
          <Route path="/writer/news" element={<WriterLayout><WriterManageNews /></WriterLayout>} />
          <Route path="/writer/news/add" element={<WriterLayout><WriterAddEditNews /></WriterLayout>} />
          <Route path="/writer/news/edit/:id" element={<WriterLayout><WriterAddEditNews /></WriterLayout>} />
          <Route path="/writer/news/preview/:id" element={<WriterLayout><WriterPreviewNews /></WriterLayout>} />
          <Route path="/writer/profile" element={<WriterLayout><WriterProfile /></WriterLayout>} />
          <Route path="/writer/quotes" element={<WriterLayout><WriterQuoteCards /></WriterLayout>} />
          <Route path="/admin/quotes" element={<AdminLayout><ManageQuoteCards /></AdminLayout>} />
          <Route path="/writer/settings" element={<WriterLayout><WriterSettings /></WriterLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
