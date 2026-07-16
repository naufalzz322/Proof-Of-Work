import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#1E293B" },
  header: { backgroundColor: "#0369A1", borderRadius: 4, padding: 20, marginBottom: 2 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  headerSub: { color: "#E0F2FE", fontSize: 10, marginTop: 4 },
  headerMeta: { color: "#BAE6FD", fontSize: 9, marginTop: 4 },
  section: { border: "1pt solid #CBD5E1", borderTop: "none", padding: 16 },
  sectionTitle: { fontSize: 8, fontWeight: "bold", color: "#0369A1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 },
  row: { flexDirection: "row", paddingVertical: 4, borderBottom: "0.5pt solid #F1F5F9" },
  rowLabel: { width: 140, color: "#64748B", fontSize: 9 },
  rowValue: { flex: 1, fontSize: 9 },
  areaBox: { border: "1pt solid #CBD5E1", borderRadius: 4, marginBottom: 12, overflow: "hidden" },
  areaHeader: { backgroundColor: "#F8FAFC", padding: 8, borderBottom: "0.5pt solid #CBD5E1", flexDirection: "row", alignItems: "center" },
  areaName: { fontSize: 10, fontWeight: "bold", flex: 1 },
  areaBadge: { fontSize: 8, fontWeight: "bold", padding: "2 6", borderRadius: 8 },
  badgeDone: { backgroundColor: "#DCFCE7", color: "#16A34A" },
  badgePending: { backgroundColor: "#FEF3C7", color: "#D97706" },
  areaBody: { padding: 12 },
  photosRow: { flexDirection: "row", marginBottom: 10 },
  photoBox: { flex: 1, border: "0.5pt solid #E2E8F0", borderRadius: 3, overflow: "hidden", marginRight: 8 },
  photoLabel: { fontSize: 7, textAlign: "center", padding: 3, backgroundColor: "#F1F5F9", color: "#64748B", fontWeight: "bold" },
  photoImg: { width: "100%", height: 80, objectFit: "cover" },
  checklistWrap: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  checkItem: { fontSize: 8, padding: "2 8", borderRadius: 10, backgroundColor: "#F1F5F9", color: "#64748B" },
  checkItemDone: { backgroundColor: "#DCFCE7", color: "#16A34A" },
  sigBox: { border: "1pt solid #CBD5E1", borderRadius: 4, padding: 12, flexDirection: "row", alignItems: "flex-start" },
  sigImg: { width: 100, height: 40, objectFit: "contain", marginRight: 16 },
  sigName: { fontSize: 10, fontWeight: "bold" },
  sigTitle: { fontSize: 8, color: "#64748B", marginTop: 2 },
  sigTime: { fontSize: 8, color: "#94A3B8", marginTop: 3 },
  footer: { backgroundColor: "#F8FAFC", border: "1pt solid #CBD5E1", borderTop: "none", padding: "8 16", textAlign: "center", color: "#64748B", fontSize: 8, borderRadius: "0 0 4 4" },
  warningText: { color: "#D97706", fontSize: 9 },
});

interface AreaPhoto { id: string; url: string; type: string; takenAt: unknown }
interface ChecklistItem { id: string; label: string; isDone: boolean }
interface JobArea { id: string; name: string; sortOrder: number; items: ChecklistItem[]; photos: AreaPhoto[] }
interface WorkerRef { id: string; name: string; phone: string }
interface WorkSession { id: string; checkInAt: unknown; checkInLat?: unknown; checkInLng?: unknown; worker: WorkerRef }
interface Client { id: string; name: string }
interface Signature { id: string; signerName: string; signerTitle: string; signedAt: unknown; signatureUrl: string }
interface JobData {
  id: string; jobNumber: string; title: string; description?: string | null;
  locationAddress: string; scheduledDate: string; scheduledTime: string; notes?: string | null;
  status: string; client: Client; areas: JobArea[]; workers: WorkSession[];
  signature: Signature | null; createdAt: string;
}

interface Props { job: JobData; completedItems: number; totalItems: number; }

function fmtDate(val: unknown): string {
  return new Date(val as string).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtDateTime(val: unknown): string {
  return new Date(val as string).toLocaleString("id-ID");
}

export function ReportPDF({ job, completedItems, totalItems }: Props) {
  const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  const teamText = job.workers.map(w => w.worker.name).join(", ");
  const progressText = progress + "% (" + completedItems + "/" + totalItems + " selesai)";
  const scheduledText = fmtDate(job.scheduledDate);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>LAPORAN PEKERJAAN</Text>
          <Text style={styles.headerSub}>{job.jobNumber} · {job.client.name}</Text>
          <Text style={styles.headerMeta}>Tanggal: {scheduledText}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pekerjaan</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Judul Pekerjaan</Text>
            <Text style={styles.rowValue}>{job.title}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Klien</Text>
            <Text style={styles.rowValue}>{job.client.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Lokasi</Text>
            <Text style={styles.rowValue}>{job.locationAddress}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tim</Text>
            <Text style={styles.rowValue}>{teamText}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Progress</Text>
            <Text style={styles.rowValue}>{progressText}</Text>
          </View>
        </View>

        {job.areas.map(area => {
          const doneCount = area.items.filter(i => i.isDone).length;
          const allDone = doneCount === area.items.length;
          const before = area.photos.filter(p => p.type === "BEFORE");
          const after = area.photos.filter(p => p.type === "AFTER");
          const badgeText = allDone ? "SELESAI" : (doneCount + "/" + area.items.length + " DONE");
          return (
            <View key={area.id} style={styles.areaBox}>
              <View style={styles.areaHeader}>
                <Text style={styles.areaName}>{area.name}</Text>
                <Text style={[styles.areaBadge, allDone ? styles.badgeDone : styles.badgePending]}>{badgeText}</Text>
              </View>
              <View style={styles.areaBody}>
                {(before.length > 0 || after.length > 0) && (
                  <View style={styles.photosRow}>
                    {before.slice(0, 1).map(p => (
                      <View key={p.id} style={styles.photoBox}>
                        <Text style={styles.photoLabel}>SEBELUM</Text>
                        {p.url.startsWith("data:") || p.url.startsWith("http")
                          ? <Image src={p.url} style={styles.photoImg} />
                          : null}
                      </View>
                    ))}
                    {after.slice(0, 1).map(p => (
                      <View key={p.id} style={[styles.photoBox, { marginRight: 0 }]}>
                        <Text style={styles.photoLabel}>SESUDAH</Text>
                        {p.url.startsWith("data:") || p.url.startsWith("http")
                          ? <Image src={p.url} style={styles.photoImg} />
                          : null}
                      </View>
                    ))}
                  </View>
                )}
                <View style={styles.checklistWrap}>
                  {area.items.map(item => (
                    <Text key={item.id} style={item.isDone ? [styles.checkItem, styles.checkItemDone] : styles.checkItem}>
                      {(item.isDone ? "✓" : "○") + " " + item.label}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tanda Tangan Klien</Text>
          {job.signature
            ? (
              <View style={styles.sigBox}>
                <Image src={job.signature.signatureUrl} style={styles.sigImg} />
                <View>
                  <Text style={styles.sigName}>{job.signature.signerName}</Text>
                  <Text style={styles.sigTitle}>{job.signature.signerTitle}</Text>
                  <Text style={styles.sigTime}>Ditandatangani: {fmtDateTime(job.signature.signedAt)}</Text>
                </View>
              </View>
            )
            : <Text style={styles.warningText}>⚠️ Pending Client Sign</Text>
          }
        </View>

        <View style={styles.footer}>
          <Text>Dokumen ini digenerate otomatis oleh sistem Proof of Work Generator · Pytagotech</Text>
        </View>
      </Page>
    </Document>
  );
}
