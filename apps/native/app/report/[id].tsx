import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { apiService } from '@/services/api.service';
import { AppText } from '@/components/ui';
import { AppColors } from '@/config/colors';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

interface ReportDetail {
  _id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  images: string[];
  address?: string;
  createdAt: string;
  user?: {
      firstName: string;
      lastName: string;
      avatar?: string;
  }
}

export default function ReportDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await apiService.get<any>(`/reports/${id}`);
        setReport(response.data);
      } catch (error) {
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchReport();
    }
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={AppColors.primary} />
      </View>
    );
  }

  if (!report) {
    return (
      <View style={styles.center}>
        <AppText>Không tìm thấy báo cáo</AppText>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Chi tiết báo cáo', headerBackTitle: '' }} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        
        {/* Header User Info */}
        <View style={styles.header}>
            <View style={styles.userInfo}>
                <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={20} color="#666" />
                </View>
                <View>
                    <AppText style={styles.userName}>
                        {report.user ? `${report.user.firstName} ${report.user.lastName}` : 'Người dùng ẩn danh'}
                    </AppText>
                    <AppText style={styles.date}>
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true, locale: vi })}
                    </AppText>
                </View>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatusColor(report.status) }]}>
                <AppText style={styles.badgeText}>{report.status}</AppText>
            </View>
        </View>

        {/* Content */}
        <AppText style={styles.title}>{report.title}</AppText>
        <AppText style={styles.description}>{report.description}</AppText>

        {/* Location */}
        {report.address && (
            <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={20} color={AppColors.primary} />
                <AppText style={styles.address}>{report.address}</AppText>
            </View>
        )}

        {/* Images */}
        {report.images && report.images.length > 0 && (
            <View style={styles.imagesContainer}>
                {report.images.map((img, index) => (
                    <Image key={index} source={{ uri: img }} style={styles.image} />
                ))}
            </View>
        )}
        
        {/* Actions (Placeholder) */}
        <TouchableOpacity style={styles.actionButton}>
            <AppText style={styles.actionButtonText}>Nhận hỗ trợ / Tham gia</AppText>
        </TouchableOpacity>

      </ScrollView>
    </>
  );
}

const getStatusColor = (status: string) => {
    switch(status) {
        case 'OPEN': return '#22c55e'; // green
        case 'IN_PROGRESS': return '#3b82f6'; // blue
        case 'RESOLVED': return '#9ca3af'; // gray
        default: return AppColors.primary;
    }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
      padding: 16,
      paddingBottom: 40
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
  },
  userInfo: {
      flexDirection: 'row',
      alignItems: 'center'
  },
  avatarPlaceholder: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#f0f0f0',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10
  },
  userName: {
      fontWeight: '600',
      fontSize: 16
  },
  date: {
      fontSize: 12,
      color: '#999'
  },
  badge: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
  },
  badgeText: {
      color: '#fff',
      fontSize: 12,
      fontWeight: '600'
  },
  title: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 8,
      color: '#333'
  },
  description: {
      fontSize: 16,
      lineHeight: 24,
      color: '#444',
      marginBottom: 16
  },
  locationContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
      backgroundColor: '#f9f9f9',
      padding: 10,
      borderRadius: 8
  },
  address: {
      marginLeft: 8,
      color: '#666',
      flex: 1
  },
  imagesContainer: {
      marginBottom: 20
  },
  image: {
      width: '100%',
      height: 200,
      borderRadius: 8,
      marginBottom: 10
  },
  actionButton: {
      backgroundColor: AppColors.primary,
      padding: 15,
      borderRadius: 8,
      alignItems: 'center'
  },
  actionButtonText: {
      color: '#000',
      fontWeight: '700',
      fontSize: 16
  }
});
