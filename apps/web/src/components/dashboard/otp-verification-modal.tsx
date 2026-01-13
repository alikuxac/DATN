import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";
import { usePhoneVerification } from "@/hooks/usePhoneVerification";
import { Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mobileNumber: string;
}

export function OTPVerificationModal({
  isOpen,
  onClose,
  mobileNumber,
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState("");
  const { verifyOtp, isVerifyingOtp } = usePhoneVerification();
    const { t } = useLanguage();

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    try {
      await verifyOtp({ code: otp });
      onClose();
    } catch (error) {
      // Error handled in hook
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("AUTH.VERIFY_OTP") || "Verify OTP"}</DialogTitle>
          <DialogDescription>
             {t("AUTH.OTP_SENT_DESC", { phone: mobileNumber }) || `Enter the 6-digit code sent to ${mobileNumber} via Telegram.`}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={(value) => setOtp(value)}
            disabled={isVerifyingOtp}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
            </InputOTPGroup>
            <InputOTPSeparator />
            <InputOTPGroup>
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
          
          <div className="flex w-full justify-end gap-2">
               <Button variant="ghost" onClick={onClose} disabled={isVerifyingOtp}>
                  {t("COMMON.BTN_CANCEL") || "Cancel"}
               </Button>
               <Button onClick={handleVerify} disabled={otp.length !== 6 || isVerifyingOtp}>
                {isVerifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("COMMON.BTN_VERIFY") || "Verify"}
              </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
