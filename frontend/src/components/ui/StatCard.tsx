import React from 'react';
import { Card, CardContent } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconBgColor?: string;
  iconColor?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon, 
  trend,
  iconBgColor = 'bg-gray-100',
  iconColor = 'text-gray-600'
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center p-6 gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBgColor} ${iconColor}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
              {trend.isPositive ? '+' : '-'}{trend.value} este mês
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
