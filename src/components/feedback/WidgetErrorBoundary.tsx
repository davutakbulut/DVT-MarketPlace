"use client";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  title?: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class WidgetErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("WidgetErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-6 border border-dashed border-red-200 bg-red-50/40 rounded-2xl min-h-[160px] text-center">
          <AlertTriangle className="w-6 h-6 text-red-500 mb-2" />
          <h5 className="text-xs font-semibold text-dark">{this.props.title ?? "Bileşen Yüklenemedi"}</h5>
          <p className="text-[11px] text-gray-500 mt-1 max-w-[220px]">
            {this.state.error?.message ?? "Veri işlenirken hata oluştu."}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3 text-[11px] gap-1 h-7 px-2.5"
            onClick={() => this.setState({ hasError: false, error: undefined })}
          >
            <RefreshCw className="w-3 h-3" /> Yeniden Dene
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
