import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import Articles from "./pages/Articles";
import News from "./pages/News";
import Writers from "./pages/Writers";
import ArticleDetail from "./pages/ArticleDetail";
import NewsDetail from "./pages/NewsDetail";
import WriterDetail from "./pages/WriterDetail";
import ProductDetail from "./pages/ProductDetail";
import Products from "./pages/Products";
import AdminDashboard from "./pages/admin/Dashboard";
import ManageArticles from "./pages/admin/ManageArticles";
import ManageNews from "./pages/admin/ManageNews";
import ManageWriters from "./pages/admin/ManageWriters";
import ManageProducts from "./pages/admin/ManageProducts";
import ManageUsers from "./pages/admin/ManageUsers";
import AdminSettings from "./pages/admin/Settings";
import Setup from "./pages/Setup";
import AdminLayout from "./components/AdminLayout";
import WriterLayout from "./components/WriterLayout";
import WriterDashboard from "./pages/writer/Dashboard";
import WriterManageArticles from "./pages/writer/ManageArticles";
import WriterManageNews from "./pages/writer/ManageNews";
import WriterProfile from "./pages/writer/Profile";
import WriterAddEditArticle from "./pages/writer/AddEditArticle";
import WriterAddEditNews from "./pages/writer/AddEditNews";
import WriterPreviewArticle from "./pages/writer/PreviewArticle";
import WriterPreviewNews from "./pages/writer/PreviewNews";
import WriterSettings from "./pages/writer/Settings";
import AdminAddEditProduct from "./pages/admin/AddEditProduct";
import ManageStoreProducts from "./pages/admin/ManageStoreProducts";
import AddEditStoreProduct from "./pages/admin/AddEditStoreProduct";
import Store from "./pages/Store";
import StoreProductDetail from "./pages/StoreProductDetail";
import AdminPreviewArticle from "./pages/admin/PreviewArticle";
import AdminPreviewNews from "./pages/admin/PreviewNews";
import AdminEditArticle from "./pages/admin/AddEditArticle";
import AdminEditNews from "./pages/admin/AddEditNews";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
        <Route path="/setup" element={<Setup />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Register />} />
          <Route path="/articles" element={<Articles />} />
          <Route path="/articles/:id" element={<ArticleDetail />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/writers" element={<Writers />} />
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
          <Route path="/admin/store" element={<AdminLayout><ManageStoreProducts /></AdminLayout>} />
          <Route path="/admin/store/add" element={<AdminLayout><AddEditStoreProduct /></AdminLayout>} />
          <Route path="/admin/store/edit/:id" element={<AdminLayout><AddEditStoreProduct /></AdminLayout>} />
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
          <Route path="/writer/settings" element={<WriterLayout><WriterSettings /></WriterLayout>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
