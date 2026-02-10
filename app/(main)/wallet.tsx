import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Alert, Platform, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';
import { useLanguage } from '@/lib/i18n';
import { GlowCard } from '@/components/GlowCard';
import { NeonButton } from '@/components/NeonButton';
import { apiRequest } from '@/lib/query-client';
import { queryClient } from '@/lib/query-client';
import { useThemeColors } from '@/lib/theme-context';

export default function WalletScreen() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { user, refreshUser } = useAuth();
  const { t } = useLanguage();
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data: transactions, refetch } = useQuery<any[]>({
    queryKey: ['/api/wallet/transactions'],
  });

  const transferMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/wallet/transfer', {
        toUserId: recipientId.trim().toUpperCase(),
        amount: parseFloat(amount),
      });
      return res.json();
    },
    onSuccess: () => {
      Alert.alert('Success', t('transferSuccess'));
      setRecipientId('');
      setAmount('');
      refreshUser();
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/wallet/transactions'] });
    },
    onError: (err: any) => {
      Alert.alert('Error', err.message || 'Transfer failed');
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshUser();
    await refetch();
    setRefreshing(false);
  };

  const handleTransfer = () => {
    if (!recipientId.trim() || !amount.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Error', 'Enter a valid amount');
      return;
    }
    if (amt > Number(user?.walletBalance || 0)) {
      Alert.alert('Error', t('insufficientBalance'));
      return;
    }
    transferMutation.mutate();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 20) }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <GlowCard style={styles.balanceCard}>
        <View style={[styles.balanceIcon, { backgroundColor: colors.primaryDim }]}>
          <Ionicons name="wallet" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>{t('balance')}</Text>
        <Text style={[styles.balanceAmount, { color: colors.primary }]}>{Number(user?.walletBalance || 0).toFixed(2)}</Text>
        <Text style={[styles.creditUnit, { color: colors.textMuted }]}>{t('credits')}</Text>
      </GlowCard>

      <GlowCard style={styles.transferCard}>
        <View style={styles.transferHeader}>
          <Ionicons name="swap-horizontal" size={20} color={colors.primary} />
          <Text style={[styles.transferTitle, { color: colors.text }]}>{t('sendCredits')}</Text>
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('enterRecipientId')}
            placeholderTextColor={colors.textMuted}
            value={recipientId}
            onChangeText={setRecipientId}
            autoCapitalize="characters"
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
          <Ionicons name="diamond-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder={t('enterAmount')}
            placeholderTextColor={colors.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <NeonButton title={t('send')} onPress={handleTransfer} loading={transferMutation.isPending} />
      </GlowCard>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('transactionHistory')}</Text>
      {(!transactions || transactions.length === 0) ? (
        <GlowCard style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={32} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noTransactions')}</Text>
        </GlowCard>
      ) : (
        <View style={styles.txList}>
          {transactions.map((tx: any) => {
            const isSent = tx.fromUserId === user?.userId;
            return (
              <GlowCard key={tx.id} style={styles.txItem}>
                <View style={styles.txRow}>
                  <View style={[styles.txIconWrap, { backgroundColor: isSent ? colors.dangerDim : colors.successDim }]}>
                    <Ionicons name={isSent ? 'arrow-up' : 'arrow-down'} size={16} color={isSent ? colors.danger : colors.success} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={[styles.txDesc, { color: colors.text }]}>{tx.description || tx.type}</Text>
                    <Text style={[styles.txTime, { color: colors.textMuted }]}>{new Date(tx.createdAt).toLocaleString()}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: isSent ? colors.danger : colors.success }]}>
                    {isSent ? '-' : '+'}{Number(tx.amount).toFixed(2)}
                  </Text>
                </View>
              </GlowCard>
            );
          })}
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
  balanceCard: {
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  balanceIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: 'HindSiliguri_400Regular',
    textTransform: 'uppercase' as const,
    letterSpacing: 2,
  },
  balanceAmount: {
    fontSize: 48,
    fontFamily: 'HindSiliguri_700Bold',
    marginTop: 4,
  },
  creditUnit: {
    fontSize: 12,
    fontFamily: 'HindSiliguri_500Medium',
    letterSpacing: 1,
  },
  transferCard: {
    padding: 20,
    marginBottom: 24,
    gap: 14,
  },
  transferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  transferTitle: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_600SemiBold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
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
  txList: {
    gap: 8,
  },
  txItem: {
    padding: 14,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  txIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: {
    flex: 1,
  },
  txDesc: {
    fontSize: 14,
    fontFamily: 'HindSiliguri_500Medium',
  },
  txTime: {
    fontSize: 11,
    fontFamily: 'HindSiliguri_400Regular',
  },
  txAmount: {
    fontSize: 16,
    fontFamily: 'HindSiliguri_700Bold',
  },
});
