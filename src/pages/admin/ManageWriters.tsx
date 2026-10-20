import { useDashboardSearch } from "@/components/DashboardSearch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X, User, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const ManageWriters = () => {
  const search = useDashboardSearch();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get("status") || "all";

  const { data: writers, isLoading } = useQuery({
    queryKey: ["admin-writers", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select("*, user_id")
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter as "approved" | "pending" | "rejected");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, email, userId, name }: { id: string; status: "approved" | "pending" | "rejected"; email: string; userId: string; name: string }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ status })
        .eq("id", id);

      if (error) throw error;

      if (status === "approved") {
        // Add writer role automatically upon approval
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: userId,
            role: "writer",
          });

        if (roleError && roleError.code !== "23505") { // Ignore duplicate key error
          throw roleError;
        }

        // Send welcome email
        try {
          const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
            body: { email, name },
          });

          if (emailError) {
            console.error('Failed to send welcome email:', emailError);
          }
        } catch (emailErr) {
          console.error('Error sending welcome email:', emailErr);
        }
      }

      return { id, status };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-writers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث حالة الكاتب",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تحديث حالة الكاتب",
        variant: "destructive",
      });
    },
  });

  const deleteWriterMutation = useMutation({
    mutationFn: async ({ profileId, userId }: { profileId: string; userId: string }) => {
      // Delete articles by this writer
      const { error: articlesError } = await supabase
        .from("articles")
        .delete()
        .eq("author_id", profileId);
      
      if (articlesError) throw articlesError;

      // Delete news by this writer
      const { error: newsError } = await supabase
        .from("news")
        .delete()
        .eq("author_id", profileId);
      
      if (newsError) throw newsError;

      // Delete user roles
      const { error: rolesError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);
      
      if (rolesError) throw rolesError;

      // Delete profile
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", profileId);
      
      if (profileError) throw profileError;

      return { profileId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-writers"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({
        title: "تم الحذف بنجاح",
        description: "تم حذف الكاتب وجميع محتوياته",
      });
    },
    onError: () => {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حذف الكاتب",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div>جاري التحميل...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">إدارة الكتاب</h1>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الكاتب</TableHead>
              <TableHead className="text-right">البريد الإلكتروني</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">تاريخ التسجيل</TableHead>
              <TableHead className="text-center">الإجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {search(writers).map((writer) => (
              <TableRow key={writer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {writer.photo_url ? (
                      <img
                        src={writer.photo_url}
                        alt={writer.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold">{writer.name}</p>
                      {writer.bio && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {writer.bio}
                        </p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {writer.email}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      writer.status === "approved"
                        ? "default"
                        : writer.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {writer.status === "approved"
                      ? "مقبول"
                      : writer.status === "rejected"
                      ? "مرفوض"
                      : "معلق"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(writer.created_at).toLocaleDateString("ar-SA")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-center gap-2">
                    {writer.status === "pending" && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: writer.id,
                              status: "approved",
                              email: writer.email,
                              userId: writer.user_id,
                              name: writer.name,
                            })
                          }
                        >
                          <Check className="w-4 h-4 ml-1" />
                          قبول
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateStatusMutation.mutate({
                              id: writer.id,
                              status: "rejected",
                              email: writer.email,
                              userId: writer.user_id,
                              name: writer.name,
                            })
                          }
                        >
                          <X className="w-4 h-4 ml-1" />
                          رفض
                        </Button>
                      </>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 ml-1" />
                          حذف
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
                          <AlertDialogDescription className="text-right">
                            سيتم حذف الكاتب <strong>{writer.name}</strong> نهائياً بما في ذلك:
                            <ul className="list-disc list-inside mt-2 space-y-1">
                              <li>جميع المقالات المنشورة</li>
                              <li>جميع الخدمات المنشورة</li>
                              <li>صلاحيات الوصول</li>
                              <li>الملف الشخصي</li>
                            </ul>
                            <p className="mt-2 text-destructive font-semibold">
                              هذا الإجراء لا يمكن التراجع عنه!
                            </p>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>إلغاء</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              deleteWriterMutation.mutate({
                                profileId: writer.id,
                                userId: writer.user_id,
                              })
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            حذف نهائياً
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {writers?.length === 0 && (
          <p className="text-center text-muted-foreground py-8">لا توجد نتائج</p>
        )}
      </Card>
    </div>
  );
};

export default ManageWriters;