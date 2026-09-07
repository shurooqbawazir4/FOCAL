/**
 * Custom hook for generating PDF reports from dashboard data
 */

import { useState } from 'react';
import { toast } from 'react-toastify';
import ReportGenerator from '../utils/ReportGenerator';

export const useReportGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const reportGenerator = new ReportGenerator();

  /**
   * Generate a comprehensive dashboard report
   * @param {Object} dashboardData - All dashboard data including stats, courses, charts
   * @param {Object} userInfo - Current user information
   * @param {Object} filters - Applied filters (course, date range, sections)
   */
  const generateDashboardReport = async (dashboardData, userInfo, filters) => {
    setIsGenerating(true);
    
    try {
      // Prepare report data
      const reportData = {
        stats: dashboardData.stats,
        courses: dashboardData.courses,
        charts: {
          bestCourses: dashboardData.bestCoursesChart,
          attentionAnalytics: dashboardData.attentionChart
        },
        sections: dashboardData.sections,
        chartSeries: dashboardData.chartSeries
      };

      // Prepare user info with department
      const userReportInfo = {
        ...userInfo,
        department: userInfo?.department || 'Computer Science'
      };

      // Prepare filter information
      const reportFilters = {
        course: filters?.selectedCourseName || 'All Courses',
        dateFrom: filters?.dateFrom,
        dateTo: filters?.dateTo,
        sections: filters?.selectedSections || []
      };

      // Generate the report
      const result = await reportGenerator.generateDashboardReport(
        reportData,
        userReportInfo,
        reportFilters
      );

      if (result.success) {
        toast.success(`Report generated successfully: ${result.filename}`);
        return result;
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(`Failed to generate report: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Generate a quick stats report
   * @param {Object} stats - Basic statistics
   * @param {Object} userInfo - Current user information
   */
  const generateQuickStatsReport = async (stats, userInfo) => {
    setIsGenerating(true);
    
    try {
      const reportData = {
        stats,
        courses: [],
        charts: null
      };

      const userReportInfo = {
        ...userInfo,
        department: userInfo?.department || 'Computer Science'
      };

      const result = await reportGenerator.generateDashboardReport(
        reportData,
        userReportInfo,
        { course: 'All Courses' }
      );

      if (result.success) {
        toast.success(`Quick stats report generated: ${result.filename}`);
        return result;
      } else {
        throw new Error(result.error || 'Failed to generate report');
      }
    } catch (error) {
      console.error('Quick report generation error:', error);
      toast.error(`Failed to generate quick report: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    isGenerating,
    generateDashboardReport,
    generateQuickStatsReport
  };
};
