"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  useForm,
  Controller,
  useWatch,
} from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { z } from "zod";

import { UploadSectionCard } from "@/features/upload-result/components/upload-section-card";

import { WizardShell } from "@/features/upload-result/components/wizard-shell";

import {
  WIZARD_STEPS,
  useUploadWizardStore,
} from "@/features/upload-result/store/upload-wizard-store";

import { CloudUploadIcon } from "@/shared/icons/ui-icons";

import {
  parseExcelFile,
  ExcelParseError,
} from "@/lib/parse-excel";

const ACCEPTED_EXTENSIONS = [
  ".xlsx",
  ".xls",
];

const MAX_FILE_SIZE_BYTES =
  10 * 1024 * 1024;

const uploadSchema = z.object({
  file: z
    .instanceof(File, {
      message:
        "Please choose an Excel file.",
    })
    .refine(
      (file) =>
        ACCEPTED_EXTENSIONS.some(
          (ext) =>
            file.name
              .toLowerCase()
              .endsWith(ext),
        ),
      "Only .xlsx and .xls files are allowed.",
    )
    .refine(
      (file) =>
        file.size <=
        MAX_FILE_SIZE_BYTES,
      "File must be 10 MB or smaller.",
    ),
});

type UploadFormValues =
  z.infer<typeof uploadSchema>;

export default function UploadFileScreen() {
  const router = useRouter();

  const setCurrentStep =
    useUploadWizardStore(
      (s) => s.setCurrentStep,
    );

  const setUploadedFile =
    useUploadWizardStore(
      (s) => s.setUploadedFile,
    );

  const setUploadMetadata =
    useUploadWizardStore(
      (s) => s.setUploadMetadata,
    );

  const setPreviewRows =
    useUploadWizardStore(
      (s) => s.setPreviewRows,
    );

  const [parseError, setParseError] =
    useState<string | null>(
      null,
    );

  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );

  useEffect(() => {
    setCurrentStep("upload");
  }, [setCurrentStep]);

  const {
    control,
    handleSubmit,
    formState: {
      errors,
      isSubmitting,
    },
  } = useForm<UploadFormValues>({
    resolver:
      zodResolver(uploadSchema),

    defaultValues: {
      file: undefined,
    },

    mode: "onChange",
  });

  const selectedFile =
    useWatch({
      control,
      name: "file",
    });

  const onSubmit =
    handleSubmit(
      async (data) => {
        const file = data.file;

        setParseError(null);

        try {
          /*
           * The parser now returns both:
           *
           * metadata
           * rows
           *
           * Metadata comes from:
           *
           * B3 = Course Code
           * E3 = Academic Session
           * E4 = Semester
           * E5 = Credit Unit
           */

          const parsed =
            await parseExcelFile(
              file,
            );

          /*
           * Store the uploaded file.
           */

          setUploadedFile({
            name: file.name,
            size: file.size,
          });

          /*
           * Store the shared course
           * metadata separately from
           * the student rows.
           */

          setUploadMetadata(
            parsed.metadata,
          );

          /*
           * Store only student-level
           * result information here.
           */

          setPreviewRows(
            parsed.rows,
          );

          setCurrentStep(
            "preview",
          );

          const previewStep =
            WIZARD_STEPS.find(
              (step) =>
                step.id ===
                "preview",
            );

          if (previewStep) {
            router.push(
              previewStep.href,
            );
          }
        } catch (err) {
          setParseError(
            err instanceof
            ExcelParseError
              ? err.message
              : "Something went wrong reading this file.",
          );
        }
      },
    );

  return (
    <WizardShell
      title="Upload Excel File"
      subtitle="Upload Excel file containing student results"
    >
      <UploadSectionCard className="border-2 border-[#2e63e5]">
        <form
          onSubmit={onSubmit}
          className="space-y-6"
        >
          <Controller
            name="file"
            control={control}
            render={({
              field: {
                onChange,
                ref,
              },
            }) => (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 sm:p-12">
                <div className="flex flex-col items-center gap-4 text-center">
                  <CloudUploadIcon className="size-12 text-[#2e63e5]" />

                  <p className="text-lg font-medium text-slate-600">
                    Drag and drop your Excel file here
                  </p>

                  <p className="text-slate-400">
                    Or
                  </p>

                  <input
                    ref={(el) => {
                      fileInputRef.current =
                        el;

                      ref(el);
                    }}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.join(
                      ",",
                    )}
                    className="sr-only"
                    onChange={(e) =>
                      onChange(
                        e.target
                          .files?.[0] ??
                          undefined,
                      )
                    }
                    aria-describedby="upload-hint"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="rounded-lg bg-[#2e63e5] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#2554c2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2e63e5] focus-visible:ring-offset-2"
                  >
                    Choose File
                  </button>

                  <p
                    id="upload-hint"
                    className="text-sm text-slate-400"
                  >
                    Only Xlsx and xls files are allowed
                  </p>
                </div>
              </div>
            )}
          />

          {selectedFile ? (
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-center text-sm text-slate-700">
              Selected:{" "}
              <span className="font-medium">
                {
                  selectedFile.name
                }
              </span>
            </div>
          ) : null}

          {(errors.file ||
            parseError) && (
            <p className="text-center text-sm text-red-500">
              {errors.file?.message ??
                parseError}
            </p>
          )}

          <div className="flex justify-center">
            <button
              type="submit"
              disabled={
                isSubmitting ||
                !selectedFile
              }
              className="rounded-lg bg-[#2e63e5] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[#2554c2] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? "Reading file..."
                : "Upload and Continue"}
            </button>
          </div>
        </form>
      </UploadSectionCard>
    </WizardShell>
  );
}
