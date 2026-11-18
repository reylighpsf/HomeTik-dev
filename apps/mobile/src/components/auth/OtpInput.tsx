import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '@/constants/theme';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  onResend?: () => void;
  isResending?: boolean;
  cooldownSeconds?: number;
  channel?: 'whatsapp' | 'sms' | 'email';
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length = 8,
  value,
  onChange,
  onComplete,
  onResend,
  isResending = false,
  cooldownSeconds = 60,
  channel = 'email',
}) => {
  const inputRefs = useRef<any[]>([]);
  const [timer, setTimer] = useState<number>(cooldownSeconds);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const handleResendPress = () => {
    if (timer === 0 && onResend) {
      setTimer(cooldownSeconds);
      onResend();
    }
  };

  const handleChangeText = (text: string, index: number) => {
    const cleanedAll = text.replace(/[^0-9]/g, '');

    // Handling paste of multiple digits
    if (cleanedAll.length > 1) {
      const cleaned = cleanedAll.slice(0, length);
      onChange(cleaned);
      if (cleaned.length === length) {
        onComplete?.(cleaned);
        inputRefs.current[length - 1]?.blur();
      } else {
        const nextIndex = Math.min(cleaned.length, length - 1);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    const digits = Array.from({ length }, (_, i) => value[i] || '');
    const newDigit = cleanedAll;

    if (newDigit) {
      digits[index] = newDigit;
      const newOtp = digits.join('');
      onChange(newOtp);

      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      } else if (newOtp.length === length) {
        onComplete?.(newOtp);
        inputRefs.current[index]?.blur();
      }
    } else {
      digits[index] = '';
      onChange(digits.join(''));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const digits = value.split('');
        digits[index - 1] = '';
        onChange(digits.join(''));
      }
    }
  };

  const otpArray = Array.from({ length }, (_, i) => value[i] || '');

  const isCompact = length > 6;

  return (
    <View style={styles.container}>
      {/* OTP Digit Inputs */}
      <View style={[styles.boxesRow, isCompact && styles.boxesRowCompact]}>
        {otpArray.map((digit, index) => {
          const isFocused = value.length === index;
          const isFilled = Boolean(digit);

          return (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[
                styles.box,
                isCompact && styles.boxCompact,
                isFilled && styles.boxFilled,
                isFocused && styles.boxFocused,
              ]}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={length}
              selectTextOnFocus
              textAlign="center"
              autoFocus={index === 0}
            />
          );
        })}
      </View>

      {/* Resend Cooldown Section */}
      <View style={styles.footerRow}>
        <View style={styles.channelBadge}>
          <Ionicons
            name={channel === 'whatsapp' ? 'logo-whatsapp' : 'mail-outline'}
            size={15}
            color={channel === 'whatsapp' ? '#25D366' : THEME.colors.primary}
          />
          <Text style={styles.channelText}>
            Terkirim via {channel === 'whatsapp' ? 'WhatsApp' : 'Email'}
          </Text>
        </View>

        <TouchableOpacity
          disabled={timer > 0 || isResending}
          onPress={handleResendPress}
          style={styles.resendBtn}
          activeOpacity={0.7}
        >
          {timer > 0 ? (
            <Text style={styles.cooldownText}>Kirim ulang ({timer}s)</Text>
          ) : (
            <Text style={styles.resendActiveText}>
              {isResending ? 'Mengirim...' : 'Kirim Ulang Kode'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  boxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  boxesRowCompact: {
    gap: 5,
  },
  box: {
    flex: 1,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  boxCompact: {
    height: 46,
    borderRadius: 10,
    fontSize: 18,
    paddingHorizontal: 0,
  },
  boxFilled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },
  boxFocused: {
    borderColor: THEME.colors.secondary, // Emerald green
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    shadowColor: THEME.colors.secondary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  channelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  channelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  resendBtn: {
    paddingVertical: 4,
  },
  cooldownText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  resendActiveText: {
    fontSize: 12,
    fontWeight: '700',
    color: THEME.colors.secondary,
  },
});
