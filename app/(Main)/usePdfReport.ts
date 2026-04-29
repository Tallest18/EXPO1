import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useCallback, useState } from "react";
import { Alert } from "react-native";
import {
  FinancialSummary,
  MonthlyReport,
  SlowMovingProduct,
  StockRecommendation,
  TopProduct,
} from "./finance.types";
import { formatCurrency } from "./formatters";

interface UsePdfReportParams {
  monthlyReport: MonthlyReport;
  financialSummary: FinancialSummary;
  topProducts: TopProduct[];
  slowMovingStock: SlowMovingProduct[];
  stockRecommendations: StockRecommendation[];
}

export const usePdfReport = ({
  monthlyReport,
  financialSummary,
  topProducts,
  slowMovingStock,
  stockRecommendations,
}: UsePdfReportParams) => {
  const [pdfLoading, setPdfLoading] = useState(false);

  const generatePDFReport = useCallback(async () => {
    if (pdfLoading) return;
    try {
      setPdfLoading(true);

      const html = `<!DOCTYPE html><html><head><style>
        body{font-family:'Helvetica','Arial',sans-serif;padding:40px;color:#1F2937}
        .header{text-align:center;margin-bottom:40px;border-bottom:3px solid #1155CC;padding-bottom:20px}
        .header h1{color:#1155CC;margin:0;font-size:32px}
        .header p{color:#6B7280;margin:10px 0 0 0;font-size:16px}
        .section{margin-bottom:30px}
        .section-title{font-size:20px;font-weight:bold;color:#1155CC;margin-bottom:15px;border-left:4px solid #1155CC;padding-left:10px}
        .stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-bottom:30px}
        .stat-card{background:#F3F4F6;padding:20px;border-radius:8px;text-align:center}
        .stat-label{color:#6B7280;font-size:14px;margin-bottom:8px}
        .stat-value{color:#1F2937;font-size:24px;font-weight:bold}
        .products-table{width:100%;border-collapse:collapse;margin-top:15px}
        .products-table th{background:#1155CC;color:white;padding:12px;text-align:left;font-size:14px}
        .products-table td{padding:12px;border-bottom:1px solid #E5E7EB;font-size:14px}
        .products-table tr:nth-child(even){background:#F9FAFB}
        .footer{margin-top:50px;text-align:center;color:#9CA3AF;font-size:12px;border-top:1px solid #E5E7EB;padding-top:20px}
        .highlight{background:#DBEAFE;padding:20px;border-radius:8px;margin:20px 0}
      </style></head><body>
        <div class="header">
          <h1>Monthly Financial Report</h1>
          <p>${monthlyReport.month}</p>
          <p>Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
        <div class="highlight"><div class="stats-grid">
          <div class="stat-card"><div class="stat-label">Total Sales</div><div class="stat-value">${formatCurrency(monthlyReport.totalSales)}</div></div>
          <div class="stat-card"><div class="stat-label">Total Cost</div><div class="stat-value">${formatCurrency(monthlyReport.totalCost)}</div></div>
          <div class="stat-card"><div class="stat-label">Total Profit</div><div class="stat-value">${formatCurrency(monthlyReport.totalProfit)}</div></div>
        </div></div>
        <div class="section"><div class="section-title">Financial Summary</div>
          <table class="products-table">
            <tr><td><strong>Total Revenue</strong></td><td>${formatCurrency(financialSummary.totalRevenue)}</td></tr>
            <tr><td><strong>Total Expenses</strong></td><td>${formatCurrency(financialSummary.totalExpenses)}</td></tr>
            <tr><td><strong>Net Profit</strong></td><td><strong>${formatCurrency(financialSummary.totalProfit)}</strong></td></tr>
          </table>
        </div>
        <div class="section"><div class="section-title">Top Performing Products</div>
          <table class="products-table">
            <thead><tr><th>Product</th><th>Units</th><th>Revenue</th><th>Profit</th></tr></thead>
            <tbody>${topProducts.map((p) => `<tr><td>${p.name}</td><td>${p.quantity}</td><td>${formatCurrency(p.revenue)}</td><td>${formatCurrency(p.profit)}</td></tr>`).join("")}</tbody>
          </table>
        </div>
        ${
          slowMovingStock.length > 0
            ? `<div class="section"><div class="section-title">Slow Moving Stock</div>
          <table class="products-table">
            <thead><tr><th>Product</th><th>Days in Stock</th><th>Quantity</th></tr></thead>
            <tbody>${slowMovingStock.map((i) => `<tr><td>${i.name}</td><td>${i.daysInStock} days</td><td>${i.quantity} units</td></tr>`).join("")}</tbody>
          </table></div>`
            : ""
        }
        ${
          stockRecommendations.length > 0
            ? `<div class="section"><div class="section-title">Stock Recommendations</div>
          ${stockRecommendations.map((r) => `<div style="background:#F9FAFB;padding:15px;margin-bottom:10px;border-radius:8px;border-left:4px solid #1155CC;"><strong>${r.message}</strong><br><span style="color:#6B7280;font-size:14px;">${r.detail}</span></div>`).join("")}
        </div>`
            : ""
        }
        <div class="footer">
          <p>This report was automatically generated by your Financial Central system.</p>
          <p>&copy; ${new Date().getFullYear()} All rights reserved.</p>
        </div>
      </body></html>`;

      const { uri } = await Print.printToFileAsync({ html });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Monthly Financial Report",
          UTI: "com.adobe.pdf",
        });
      } else {
        Alert.alert("Success", "Report generated successfully!");
      }
    } catch {
      Alert.alert("Error", "Failed to generate PDF report. Please try again.");
    } finally {
      setPdfLoading(false);
    }
  }, [
    pdfLoading,
    monthlyReport,
    financialSummary,
    topProducts,
    slowMovingStock,
    stockRecommendations,
  ]);

  return { pdfLoading, generatePDFReport };
};
