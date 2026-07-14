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
    <Card padding="lg" className="min-h-[320px] overflow-hidden border-white/70 bg-white/72 shadow-[0_18px_45px_rgba(24,86,115,0.12)] backdrop-blur-xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="inline-flex rounded-full border border-[#b7d5de] bg-[#edf8fb] px-3 py-1 text-xs font-semibold text-[#0a6792]">
            Patient card
          </div>
          <h2 className="mt-4 text-xl font-semibold tracking-normal text-[#062f3d]">
            Profile snapshot
          </h2>
          <p className="mt-1 text-sm text-[#55717b]">
            Medical basics and emergency details for quick reference.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
        <div className="flex items-center gap-2 rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 p-4 text-sm text-[#55717b]">
          <Spinner size="sm" /> Loading patient card...
        </div>
      ) : error ? (
        <p className="rounded-2xl border border-red-200 bg-[var(--error-bg)] p-4 text-sm text-[var(--error)]">{error}</p>
      ) : patient ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-[24px] border border-[#d8edf3] bg-[#dceff5]/70 p-5 text-[#062f3d] shadow-sm backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#0a6792] text-base font-semibold text-[#eaf8fb]">
                {getInitials(patient.first_name, patient.last_name)}
              </div>
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">
                  {fullName || "-"}
                </p>
                <p className="mt-1 break-all text-xs font-medium text-[#456773]">
                  ID: {patientCardId(patient.id)}
                </p>
              </div>
            </div>

            {hasBadges && (
              <div className="mt-5 flex flex-wrap gap-2">
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

            {hasEmergencyContact && (
              <div className="mt-5 rounded-2xl border border-white/65 bg-white/48 px-4 py-3 backdrop-blur-xl">
                <p className="text-xs font-medium text-[#55717b]">Emergency contact</p>
                {patient.emergency_contact_name && (
                  <p className="mt-1 text-sm font-semibold text-[#062f3d]">
                    {patient.emergency_contact_name}
                  </p>
                )}
                {patient.emergency_contact_phone && (
                  <p className="mt-0.5 text-xs text-[#55717b]">
                    {formatPhone(patient.emergency_contact_phone)}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-4">
            {details.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {details.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
                    <p className="text-xs font-medium text-[#55717b]">{item.label}</p>
                    <p className="mt-1 truncate text-sm font-semibold text-[#062f3d]">
                      {displayValue(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {medicalDetails.length > 0 && (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {medicalDetails.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-3">
                    <p className="text-xs font-medium text-[#55717b]">{item.label}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-[#062f3d]">
                      {displayValue(item.value)}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {details.length === 0 && medicalDetails.length === 0 && !hasEmergencyContact && (
              <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 px-4 py-5">
                <p className="text-sm font-semibold text-[#062f3d]">
                  Add optional profile details
                </p>
                <p className="mt-1 text-sm text-[#55717b]">
                  Blood group, city, allergies, and emergency contact will appear here once saved.
                </p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#d8edf3] bg-[#f8fcfd]/78 p-4">
          <p className="text-sm font-semibold text-[#062f3d]">
            Patient profile not found
          </p>
          <p className="mt-1 text-sm text-[#55717b]">
            Complete your profile to generate the card snapshot.
          </p>
        </div>
      )}
    </Card>
  );
}
