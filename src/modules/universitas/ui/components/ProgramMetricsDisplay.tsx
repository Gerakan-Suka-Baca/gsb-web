"use client";

import { useState } from "react";
import { Users, Target, ShieldAlert, Banknote } from "lucide-react";

type ProgramMetric = {
  year?: string;
  capacity?: number | null;
  applicants?: number | null;
  predictedApplicants?: number | null;
  admissionMetric?: string | null;
  passingPercentage?: string | null;
  avgUkt?: string | null;
  maxUkt?: string | null;
};

export function ProgramMetricsDisplay({ metrics }: { metrics: ProgramMetric[] }) {
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);

  if (!metrics || metrics.length === 0) {
    return <p className="text-muted-foreground text-sm italic py-4">Data detil metrik belum terakumulasi untuk prodi ini.</p>;
  }

  const metric = metrics[selectedYearIndex];

  return (
    <div className="bg-muted/50 rounded-xl p-4 sm:p-6 border border-border mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-border pb-2">
        <h4 className="font-bold text-foreground flex items-center gap-2">
          Data Analitik
        </h4>
        <div className="flex items-center gap-2">
          <label htmlFor={`year-select-${metric.year}`} className="text-sm font-semibold text-muted-foreground">Pilih Tahun:</label>
          <select 
            id={`year-select-${metric.year}`}
            value={selectedYearIndex}
            onChange={(e) => setSelectedYearIndex(Number(e.target.value))}
            className="border border-input rounded-md text-sm py-1.5 px-3 bg-background text-foreground font-medium focus:ring-1 focus:ring-primary focus:border-primary outline-none cursor-pointer"
          >
            {metrics.map((m, idx) => (
              <option key={idx} value={idx}>{m.year} {idx === 0 ? "(Terbaru / Prediksi Target)" : ""}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex flex-col justify-between hover:border-gsb-blue/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Daya Tampung</span>
                  <Users className="w-4 h-4 text-gsb-blue" />
              </div>
              <span className="text-2xl font-black text-foreground">
                  {metric.capacity ?? <span className="text-muted-foreground/50 text-lg">-</span>}
              </span>
          </div>
          
          <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex flex-col justify-between hover:border-gsb-orange/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pendaftar</span>
                  <Users className="w-4 h-4 text-gsb-orange" />
              </div>
              <div className="flex flex-col">
                  <span className="text-2xl font-black text-foreground">
                      {metric.applicants ?? <span className="text-muted-foreground/50 text-lg">-</span>}
                      <span className="text-xs font-medium text-muted-foreground/70 font-sans ml-1">orang</span>
                  </span>
                  {metric.predictedApplicants && (
                      <span className="text-[10px] text-gsb-orange/90 font-semibold bg-gsb-orange/10 rounded px-1.5 py-0.5 w-max mt-1">
                          Prediksi Thn Depan: {metric.predictedApplicants}
                      </span>
                  )}
              </div>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex flex-col justify-between hover:border-gsb-tosca/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Skor / UTBK</span>
                  <Target className="w-4 h-4 text-gsb-tosca" />
              </div>
              <div className="flex flex-col">
                  <span className="text-2xl font-black text-foreground font-mono">
                      {metric.admissionMetric || <span className="text-muted-foreground/50 text-lg">-</span>}
                  </span>
              </div>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border shadow-sm flex flex-col justify-between hover:border-gsb-pink/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Persentase Lulus</span>
                  <ShieldAlert className="w-4 h-4 text-gsb-pink" />
              </div>
              <span className="text-2xl font-black text-foreground">
                  {metric.passingPercentage || <span className="text-muted-foreground/50 text-lg">-</span>}
              </span>
          </div>
      </div>

      {(metric.avgUkt || metric.maxUkt) && (
            <div className="mt-4 bg-card p-4 rounded-lg border border-gsb-tosca/30 shadow-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-gsb-tosca/10 p-2.5 rounded-full">
                        <Banknote className="w-5 h-5 text-gsb-tosca" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground">Estimasi Biaya UKT</p>
                        <p className="text-xs text-muted-foreground">Rata-rata hingga batas maksimal golongan</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-sm font-semibold text-muted-foreground">Rerata: <span className="text-gsb-tosca font-black">{metric.avgUkt || "-"}</span></p>
                    {metric.maxUkt && <p className="text-xs text-muted-foreground font-medium">Maks: {metric.maxUkt}</p>}
                </div>
            </div>
      )}
    </div>
  );
}
