// Simple in-memory store for MVP
export interface Query {
  id: string;
  text: string;
  timestamp: number;
  interpretation?: {
    understood: string;
    metrics: string[];
    period: string;
    filters: string[];
    breakdown: string;
  };
  sql?: string;
  isValid: boolean;
  error?: string;
  suggestion?: string;
  result?: {
    table: Array<Record<string, any>>;
    chartData: Array<Record<string, any>>;
    explanation: string;
  };
}

export interface SavedReport {
  id: string;
  name: string;
  queryId: string;
  savedAt: number;
  lastRun?: number;
}

class Store {
  private queries: Map<string, Query> = new Map();
  private reports: Map<string, SavedReport> = new Map();

  // Initialize with sample data
  constructor() {
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Sample saved report
    const sampleQuery: Query = {
      id: 'sample-1',
      text: 'Показать продажи по регионам за последний квартал',
      timestamp: Date.now() - 86400000 * 7,
      interpretation: {
        understood: 'Анализ продаж с разбивкой по регионам',
        metrics: ['Сумма продаж', 'Количество заказов'],
        period: 'Q1 2026 (январь - март)',
        filters: ['Статус: завершено'],
        breakdown: 'По регионам'
      },
      sql: `SELECT
  region,
  SUM(amount) as total_sales,
  COUNT(*) as order_count
FROM sales
WHERE date >= '2026-01-01'
  AND date <= '2026-03-31'
  AND status = 'completed'
GROUP BY region
ORDER BY total_sales DESC`,
      isValid: true,
      result: {
        table: [
          { region: 'Москва', total_sales: 5420000, order_count: 1234 },
          { region: 'Санкт-Петербург', total_sales: 3210000, order_count: 876 },
          { region: 'Новосибирск', total_sales: 1890000, order_count: 543 },
          { region: 'Екатеринбург', total_sales: 1670000, order_count: 487 },
          { region: 'Казань', total_sales: 1230000, order_count: 356 }
        ],
        chartData: [
          { region: 'Москва', value: 5420000 },
          { region: 'СПб', value: 3210000 },
          { region: 'Новосибирск', value: 1890000 },
          { region: 'Екатеринбург', value: 1670000 },
          { region: 'Казань', value: 1230000 }
        ],
        explanation: 'Анализ показывает, что Москва лидирует по объему продаж с 5.42М₽, что составляет 40% от общего объема. Санкт-Петербург на втором месте с 3.21М₽ (24%). Региональные продажи демонстрируют стабильный рост по сравнению с предыдущим кварталом.'
      }
    };

    this.queries.set(sampleQuery.id, sampleQuery);

    const sampleReport: SavedReport = {
      id: 'report-1',
      name: 'Квартальный отчет по регионам',
      queryId: 'sample-1',
      savedAt: Date.now() - 86400000 * 7,
      lastRun: Date.now() - 86400000 * 2
    };

    this.reports.set(sampleReport.id, sampleReport);
  }

  processQuery(queryText: string): Query {
    const id = `query-${Date.now()}`;

    // Simulate query interpretation
    const query: Query = {
      id,
      text: queryText,
      timestamp: Date.now(),
      isValid: true
    };

    // Simple validation logic
    if (queryText.trim().length < 5) {
      query.isValid = false;
      query.error = 'Запрос слишком короткий';
      query.suggestion = 'Попробуйте описать, какие данные вы хотите увидеть. Например: "Показать выручку по месяцам за 2026 год"';
    } else {
      // Mock interpretation
      query.interpretation = {
        understood: this.interpretQuery(queryText),
        metrics: this.extractMetrics(queryText),
        period: this.extractPeriod(queryText),
        filters: this.extractFilters(queryText),
        breakdown: this.extractBreakdown(queryText)
      };

      query.sql = this.generateSQL(query.interpretation);
      query.result = this.generateMockResult(query.interpretation);
    }

    this.queries.set(id, query);
    return query;
  }

  private interpretQuery(text: string): string {
    if (text.includes('продаж') || text.includes('выручк')) return 'Анализ продаж';
    if (text.includes('клиент')) return 'Анализ клиентов';
    if (text.includes('заказ')) return 'Анализ заказов';
    return 'Анализ данных';
  }

  private extractMetrics(text: string): string[] {
    const metrics = [];
    if (text.includes('продаж') || text.includes('выручк')) metrics.push('Сумма продаж');
    if (text.includes('количество')) metrics.push('Количество');
    if (text.includes('средн')) metrics.push('Среднее значение');
    return metrics.length > 0 ? metrics : ['Количество записей'];
  }

  private extractPeriod(text: string): string {
    if (text.includes('квартал')) return 'Последний квартал';
    if (text.includes('месяц')) return 'Последний месяц';
    if (text.includes('год')) return '2026 год';
    if (text.includes('неделю')) return 'Последняя неделя';
    return 'Весь период';
  }

  private extractFilters(text: string): string[] {
    const filters = [];
    if (text.includes('завершен')) filters.push('Статус: завершено');
    if (text.includes('актив')) filters.push('Статус: активно');
    return filters;
  }

  private extractBreakdown(text: string): string {
    if (text.includes('регион')) return 'По регионам';
    if (text.includes('месяц')) return 'По месяцам';
    if (text.includes('категор')) return 'По категориям';
    if (text.includes('продукт')) return 'По продуктам';
    return 'Общий итог';
  }

  private generateSQL(interpretation: any): string {
    return `SELECT
  category,
  COUNT(*) as count,
  SUM(amount) as total
FROM data
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY category
ORDER BY total DESC`;
  }

  private generateMockResult(interpretation: any) {
    const categories = ['Категория А', 'Категория Б', 'Категория В', 'Категория Г', 'Категория Д'];

    return {
      table: categories.map((cat, i) => ({
        category: cat,
        count: Math.floor(Math.random() * 500) + 100,
        total: Math.floor(Math.random() * 2000000) + 500000
      })),
      chartData: categories.map((cat, i) => ({
        name: cat,
        value: Math.floor(Math.random() * 2000000) + 500000
      })),
      explanation: `Анализ данных за указанный период. ${interpretation.understood} с разбивкой ${interpretation.breakdown.toLowerCase()}. Всего обработано записей в выборке.`
    };
  }

  getQuery(id: string): Query | undefined {
    return this.queries.get(id);
  }

  saveReport(name: string, queryId: string): SavedReport {
    const id = `report-${Date.now()}`;
    const report: SavedReport = {
      id,
      name,
      queryId,
      savedAt: Date.now()
    };
    this.reports.set(id, report);
    return report;
  }

  getReport(id: string): SavedReport | undefined {
    return this.reports.get(id);
  }

  getAllReports(): SavedReport[] {
    return Array.from(this.reports.values()).sort((a, b) => b.savedAt - a.savedAt);
  }

  rerunReport(reportId: string): Query | null {
    const report = this.reports.get(reportId);
    if (!report) return null;

    const originalQuery = this.queries.get(report.queryId);
    if (!originalQuery) return null;

    const newQuery = this.processQuery(originalQuery.text);
    report.lastRun = Date.now();
    return newQuery;
  }

  deleteReport(id: string) {
    this.reports.delete(id);
  }
}

export const store = new Store();
