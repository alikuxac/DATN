import { useMutation } from "@tanstack/react-query";
import api from "@/lib/axios";
import { toast } from "sonner";

interface SendOtpRequest {
  mobileNumber: string;
}

interface VerifyOtpRequest {
  code: string;
}

export function usePhoneVerification() {
  const sendOtpMutation = useMutation({
    mutationFn: async (data: SendOtpRequest) => {
      await api.post('/users/phone/send-otp', data);
    },
    onSuccess: () => {
      toast.success("OTP sent via Telegram");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send OTP");
    },
  });

  const verifyOtpMutation = useMutation({
    mutationFn: async (data: VerifyOtpRequest) => {
      await api.post('/users/phone/verify-otp', data);
    },
    onSuccess: () => {
      toast.success("Phone number verified successfully");
      window.location.reload(); // Refresh user data
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to verify OTP");
    },
  });

  return {
    sendOtp: sendOtpMutation.mutateAsync,
    isSendingOtp: sendOtpMutation.isPending,
    verifyOtp: verifyOtpMutation.mutateAsync,
    isVerifyingOtp: verifyOtpMutation.isPending,
  };
}
