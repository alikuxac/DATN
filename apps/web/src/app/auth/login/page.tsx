"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const formSchema = z.object({
  email: z.string().min(1, "Username or Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function LoginPage() {
  const { login, isLoggingIn, loginError } = useAuth();
  const { t } = useLanguage();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    login(values);
  }

  return (
    <div className="flex h-screen items-center justify-center bg-muted/50 relative">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t("AUTH.LOGIN_TITLE")}</CardTitle>
          <CardDescription>
            {t("AUTH.MSG_WELCOME_BACK")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" method="post">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("AUTH.LABEL_EMAIL")}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("AUTH.LABEL_EMAIL")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("AUTH.LABEL_PASSWORD")}</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="******" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {loginError && (
                <div className="text-sm text-destructive font-medium">
                  {loginError instanceof Error ? loginError.message : t("AUTH.ERR_LOGIN_FAILED")}
                </div>
              )}
              <div className="flex items-center justify-end">
                <Link 
                  href="/auth/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  {t("AUTH.FORGOT_PASSWORD")}
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={isLoggingIn}>
                {isLoggingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("AUTH.BTN_LOGIN")}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
