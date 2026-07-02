import { UploadCloud } from "lucide-react";

import { ProjectImportUploader } from "@/components/admin/imports/project-import-uploader";

export default function AdminImportsPage() {
  return (
    <main className="space-y-8 p-6">
      <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="relative bg-gradient-to-br from-slate-950 via-blue-800 to-blue-600 p-8 text-white">
          <div className="absolute -right-10 -top-10 size-56 rounded-full bg-white/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.22em] text-blue-100">
                Admin Import Center
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Project Data Import
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-blue-100">
                Upload JSON import scripts to create or update projects,
                layouts, units, tags, amenities, and nearby places.
              </p>
            </div>

            <span className="grid size-14 place-items-center rounded-3xl bg-white/15">
              <UploadCloud className="size-6" />
            </span>
          </div>
        </div>
      </section>

      <ProjectImportUploader />
    </main>
  );
}
