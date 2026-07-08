"use client";

import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
import { formatDate, formatPhone, getInitials } from "@/lib/utils";
import { Patient } from "@/types/patient";

interface PatientSnapshotCardProps {
  patient: Patient | null;
  loading?: boolean;
  error?: string;
}

function displayValue(value?: string | number | null) {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

function hasValue(value?: string | number | null) {
  return value !== undefined && value !== null && value !== "";
}

function patientCardId(patientId: string) {
  return `MED-${patientId.replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function calculateAge(dateOfBirth?: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  if (Number.isNaN(dob.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadPatientCard({
  patient,
  fullName,
  age,
  location,
  bodyMetrics,
}: {
  patient: Patient;
  fullName: string;
  age: number | null;
  location: string;
  bodyMetrics: string;
}) {
  const cardId = patientCardId(patient.id);
  const fields = [
    patient.blood_group ? ["Blood group", patient.blood_group] : null,
    patient.gender ? ["Gender", patient.gender.replaceAll("_", " ")] : null,
    age !== null ? ["Age", `${age} years`] : null,
    patient.date_of_birth ? ["Date of birth", formatDate(patient.date_of_birth)] : null,
    bodyMetrics ? ["Body", bodyMetrics] : null,
    patient.phone ? ["Phone", formatPhone(patient.phone)] : null,
    location ? ["Location", location] : null,
    patient.allergies ? ["Allergies", patient.allergies] : null,
    patient.existing_conditions ? ["Conditions", patient.existing_conditions] : null,
    patient.emergency_contact_name
      ? ["Emergency contact", patient.emergency_contact_name]
      : null,
    patient.emergency_contact_phone
      ? ["Emergency phone", formatPhone(patient.emergency_contact_phone)]
      : null,
  ].filter((item): item is [string, string] => item !== null);

  const rows = fields
    .map(
      ([label, value]) => `
        <div class="row">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
        </div>
      `
    )
    .join("");

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(cardId)} - Patient Card</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f5f7fb;
      font-family: Arial, sans-serif;
      color: #172033;
    }
    .card {
      width: 420px;
      border: 1px solid #d8dee9;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 12px 30px rgba(23, 32, 51, 0.10);
      overflow: hidden;
    }
    .header {
      padding: 22px;
      background: #0f766e;
      color: #ffffff;
    }
    .brand {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      opacity: 0.86;
    }
    h1 {
      margin: 14px 0 4px;
      font-size: 24px;
      line-height: 1.2;
    }
    .id {
      font-size: 13px;
      opacity: 0.9;
    }
    .content {
      padding: 18px 22px 22px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 18px;
      padding: 11px 0;
      border-bottom: 1px solid #eef1f5;
      font-size: 14px;
    }
    .row span {
      color: #607086;
    }
    .row strong {
      text-align: right;
      font-weight: 700;
      color: #172033;
    }
    .footer {
      margin-top: 18px;
      font-size: 11px;
      color: #778499;
    }
    @media print {
      body {
        background: white;
      }
      .card {
        box-shadow: none;
      }
    }
  </style>
</head>
<body>
  <main class="card">
    <section class="header">
      <div class="brand">MedFlow Patient Card</div>
      <h1>${escapeHtml(fullName || "-")}</h1>
      <div class="id">Patient ID: ${escapeHtml(cardId)}</div>
    </section>
    <section class="content">
      ${rows || '<div class="row"><span>Profile</span><strong>Basic card created</strong></div>'}
      <div class="footer">Downloaded from MedFlow.</div>
    </section>
  </main>
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${cardId.toLowerCase()}-patient-card.html`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function PatientSnapshotCard({
  patient,
  loading = false,
  error = "",
}: PatientSnapshotCardProps) {
  const fullName = patient
    ? `${patient.first_name} ${patient.last_name}`.trim()
    : "";
  const age = calculateAge(patient?.date_of_birth);
  const location = [patient?.city, patient?.state].filter(Boolean).join(", ");
  const bodyMetrics = [
    patient?.height ? `${patient.height} cm` : null,
    patient?.weight ? `${patient.weight} kg` : null,
  ].filter(Boolean).join(" / ");
  const hasBadges = !!patient?.blood_group || !!patient?.gender || age !== null;
  const details = patient
    ? [
        {
          label: "Date of birth",
          value: patient.date_of_birth ? formatDate(patient.date_of_birth) : null,
        },
        { label: "Body", value: bodyMetrics || null },
        {
          label: "Phone",
          value: patient.phone ? formatPhone(patient.phone) : null,
        },
        { label: "Location", value: location || null },
      ].filter((item) => hasValue(item.value))
    : [];
  const medicalDetails = patient
    ? [
        { label: "Allergies", value: patient.allergies },
        { label: "Conditions", value: patient.existing_conditions },
      ].filter((item) => hasValue(item.value))
    : [];
  const hasEmergencyContact =
    !!patient?.emergency_contact_name || !!patient?.emergency_contact_phone;

  return (
    <Card padding="lg" className="min-h-[300px]">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">
            Patient card
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Profile snapshot and medical basics
          </p>
        </div>
        <div className="flex items-center gap-2">
          {patient && !loading && !error && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadPatientCard({
                  patient,
                  fullName,
                  age,
                  location,
                  bodyMetrics,
                })
              }
            >
              Download
            </Button>
          )}
          <Link href="/profile">
            <Button variant="outline" size="sm">Edit</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Spinner size="sm" /> Loading patient card...
        </div>
      ) : error ? (
        <p className="text-sm text-[var(--error)]">{error}</p>
      ) : patient ? (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--accent-light)] flex items-center justify-center text-sm font-semibold text-[var(--accent)] shrink-0">
              {getInitials(patient.first_name, patient.last_name)}
            </div>
            <div className="min-w-0">
              <p className="text-base font-semibold text-[var(--text-primary)] truncate">
                {fullName || "-"}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                Patient ID: {patientCardId(patient.id)}
              </p>
            </div>
          </div>

          {hasBadges && (
            <div className="flex flex-wrap gap-2">
              {patient.blood_group && (
                <Badge variant="accent">Blood {patient.blood_group}</Badge>
              )}
              {patient.gender && (
                <Badge variant="neutral" className="capitalize">
                  {patient.gender.replaceAll("_", " ")}
                </Badge>
              )}
              {age !== null && <Badge variant="neutral">{age} years</Badge>}
            </div>
          )}

          {details.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {details.map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5 truncate">
                    {displayValue(item.value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {medicalDetails.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {medicalDetails.map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-[var(--text-muted)]">{item.label}</p>
                  <p className="text-sm text-[var(--text-primary)] mt-0.5 line-clamp-2">
                    {displayValue(item.value)}
                  </p>
                </div>
              ))}
            </div>
          )}

          {hasEmergencyContact && (
            <div className="pt-4 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">Emergency contact</p>
              {patient.emergency_contact_name && (
                <p className="text-sm font-medium text-[var(--text-primary)] mt-0.5">
                  {patient.emergency_contact_name}
                </p>
              )}
              {patient.emergency_contact_phone && (
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {formatPhone(patient.emergency_contact_phone)}
                </p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-[var(--text-primary)]">
            Patient profile not found
          </p>
          <p className="text-sm text-[var(--text-muted)]">
            Complete your profile to generate the card snapshot.
          </p>
        </div>
      )}
    </Card>
  );
}
