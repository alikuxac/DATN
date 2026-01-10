"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import api from "@/lib/axios";

const formSchema = z.object({
  otp: z.string().length(12, "OTP must be 12 characters"),
});

export default function VerifyOTPPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const { t } = useLanguage();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      await api.post(`/public/reset-password/verify/${token}`, {
        otp: values.otp,
      });

      // Redirect to reset password page
      router.push(`/auth/forgot-password/reset/${token}`);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <Link href="/auth/forgot-password">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <CardTitle className="text-2xl font-bold">{t("AUTH.TITLE_VERIFY_OTP")}</CardTitle>
          </div>
          <CardDescription>
            {t("AUTH.DESC_VERIFY_OTP")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="otp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("AUTH.LABEL_OTP")}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="123456789012" 
                        maxLength={12}
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      {t("AUTH.DESC_OTP_HINT")}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div className="text-sm text-destructive font-medium">
                  {error}
                </div>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("AUTH.BTN_VERIFY")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
