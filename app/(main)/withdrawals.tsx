import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Platform, Pressable, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import { NeonButton } from '@/components/NeonButton';
import { apiRequest, queryClient } from '@/lib/query-client';
import { useThemeColors } from '@/lib/theme-context';

const METHODS = [
  { id: 'bkash', label: 'bKash', icon: 'phone-portrait-outline' },
  { id: 'nagad', label: 'Nagad', icon: 'phone-portrait-outline' },
  { id: 'bank', label: 'Bank Transfer', icon: 'business-outline' },
];

export default function WithdrawalsScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: withdrawals, refetch } = useQuery<any[]>({
    queryKey: ['/api/withdrawals/history'],
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/withdrawals/create', {
        amount: parseFloat(amount),
        method,
        accountDetails: accountDetails.trim(),
      });
      return res.json();
    },
    onSuccess: () => {
      Alert.alert('Success', t('withdrawalSubmitted'));
      setAmount('');
      setMethod('');
      setAccountDetails('');
      refreshUser();
      refetch();
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Withdrawal failed');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleWithdraw = () => {
    if (!amount.trim() || !method || !accountDetails.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    if (amt < 100) {
      Alert.alert('Error', t('minimumAmount') + ': 100');
      return;
    }
    if (amt > Number(user?.walletBalance || 0)) {
      Alert.alert('Error', t('insufficientBalance'));
      return;
    }
    withdrawMutation.mutate();
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'success': return colors.success;
      case 'failed': return colors.danger;
      default: return colors.warning;
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case 'success': return 'checkmark-circle';
      case 'failed': return 'close-circle';
      default: return 'time';
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <GlowCard style={styles.formCard}>
        <View style={styles.formHeader}>
          <Ionicons name="arrow-down-circle" size={22} color={colors.primary} />
          <Text style={[styles.formTitle, { color: colors.text }]}>{t('requestWithdraw')}</Text>
        </View>

        <View style={[styles.balanceRow, { backgroundColor: colors.primaryDim }]}>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t('balance')}:</Text>
          <Text style={[styles.balanceValue, { color: colors.primary }]}>{Number(user?.walletBalance || 0).toFixed(2)} {t('credits')}</Text>
        </View>

        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>{t('method')}</Text>
        <View style={styles.methodRow}>
          {METHODS.map((m) => (
            <Pressable
              key={m.id}
              onPress={() => setMethod(m.id)}
              style={[
                styles.methodBtn,
                { borderColor: colors.cardBorder, backgroundColor: colors.card },
                method === m.id && { borderColor: colors.primary, backgroundColor: colors.primaryDim },
              ]}
            >
              <Ionicons name={m.icon as any} size={18} color={method === m.id ? colors.primary : colors.textSecondary} />
              <Text style={[styles.methodLabel, { color: colors.textSecondary }, method === m.id && { color: colors.primary }]}>{m.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Ionicons name="diamond-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('withdrawAmount')}
            placeholderTextColor={colors.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Ionicons name="card-outline" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('enterAccountDetails')}
            placeholderTextColor={colors.textMuted}
            value={accountDetails}
            onChangeText={setAccountDetails}
          />
        </View>

        <NeonButton title={t('submit')} onPress={handleWithdraw} loading={withdrawMutation.isPending} />
      </GlowCard>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('history')}</Text>
      {(!withdrawals || withdrawals.length === 0) ? (
        <GlowCard style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noWithdrawals')}</Text>
        </GlowCard>
      ) : (
        <View style={styles.historyList}>
          {withdrawals.map((w: any) => (
            <GlowCard key={w.id} style={styles.historyItem}>
              <View style={styles.historyRow}>
                <View style={[styles.statusIcon, { backgroundColor: statusColor(w.status) + '22' }]}>
                  <Ionicons name={statusIcon(w.status) as any} size={18} color={statusColor(w.status)} />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={[styles.historyAmount, { color: colors.text }]}>{Number(w.amount).toFixed(2)} {t('credits')}</Text>
                  <Text style={[styles.historyMethod, { color: colors.textMuted }]}>{w.method} - {w.accountDetails}</Text>
                  <Text style={[styles.historyDate, { color: colors.textMuted }]}>{new Date(w.createdAt).toLocaleDateString()}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor(w.status) + '22', borderColor: statusColor(w.status) + '44' }]}>
                  <Text style={[styles.statusText, { color: statusColor(w.status) }]}>{t(w.status)}</Text>
                </View>
              </View>
            </GlowCard>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
  },
  formCard: {
    padding: 20,
    marginTop: 8,
    marginBottom: 24,
    gap: 14,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_400Regular',
  },
  balanceValue: {
    fontSize: 15,
    fontFamily: 'HindSiliguri_700Bold',
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_500Medium',
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  methodLabel: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_500Medium',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'HindSiliguri_500Medium',
    fontSize: 14,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_400Regular',
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    padding: 14,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyInfo: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 15,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  historyMethod: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_400Regular',
  },
  historyDate: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_600SemiBold',
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
});
