"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginValues) => {
    const result = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (result?.error) {
      toast.error("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-white to-blue-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-brand-accent/20 blur-3xl" />

      <Card className="glass-card relative w-full max-w-sm">
        <CardHeader className="items-center text-center">
          <Image
            src="/logo.jpg"
            alt="Alhatimi Glass and Glazing"
            width={88}
            height={88}
            className="mb-2 rounded-full shadow-lg"
            priority
          />
          <CardTitle className="text-xl">Alhatimi Glass and Glazing</CardTitle>
          <CardDescription>Sign in to the quotation management system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@alhatimiglass.com"
                autoComplete="email"
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register("password")}
              />
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>
            <Button type="submit" variant="brand" size="lg" disabled={isSubmitting} className="mt-2">
              {isSubmitting && <Loader2 className="animate-spin" />}
              Sign In
            </Button>
          </form>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            Demo: admin@alhatimiglass.com / Admin@123
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense fallback={null}>
      <LoginForm />
    </React.Suspense>
  );
}
