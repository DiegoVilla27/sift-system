import { NextResponse } from "next/server";
import {
  getSchedulerState,
  executeSchedulerTick,
  startScheduler,
  stopScheduler,
} from "@/modules/scheduler/schedulerService";

export async function GET() {
  const state = getSchedulerState();
  return NextResponse.json({ success: true, scheduler: state });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, intervalHours } = body;

    if (action === "trigger") {
      const result = await executeSchedulerTick();
      return NextResponse.json({ success: true, result, scheduler: getSchedulerState() });
    }

    if (action === "start") {
      startScheduler(intervalHours || 4);
      return NextResponse.json({ success: true, message: "Scheduler iniciado", scheduler: getSchedulerState() });
    }

    if (action === "stop") {
      stopScheduler();
      return NextResponse.json({ success: true, message: "Scheduler detenido", scheduler: getSchedulerState() });
    }

    return NextResponse.json({ success: false, error: "Acción no válida (trigger, start, stop)" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Error en scheduler" },
      { status: 500 }
    );
  }
}
