"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import QRCode from "qrcode"
import { Checkbox } from "@/components/ui/checkbox"
import { ImageIcon, X } from "lucide-react"

export default function QRCodeGenerator() {
  const [url, setUrl] = useState("")
  const [qrCode, setQrCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [showScanText, setShowScanText] = useState(true)
  const [centerImage, setCenterImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const generateQRCode = async () => {
    if (!url) {
      setError("Please enter a URL")
      return
    }

    try {
      setIsGenerating(true)
      setError("")

      // Generate QR code as data URL with higher error correction for logo
      const dataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 0,
        errorCorrectionLevel: "H", // Highest error correction for logo
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })

      setQrCode(dataUrl)
    } catch (err) {
      setError("Failed to generate QR code. Please check your URL.")
      console.error(err)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      setCenterImage(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const clearCenterImage = () => {
    setCenterImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const downloadQRCode = () => {
    if (!qrCode) return;

    // Create a canvas to combine the elements
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const qrImage = new Image();

    qrImage.onload = () => {
      // Set canvas size to accommodate QR code with padding
      const padding = 20;
      const headerHeight = 40;
      canvas.width = qrImage.width + padding * 2;
      canvas.height = qrImage.height + headerHeight + padding * 2;

      // Draw blue background with rounded corners
      ctx.fillStyle = "#2563EB"; // Blue color
      ctx.beginPath();
      ctx.roundRect(0, 0, canvas.width, canvas.height, 12);
      ctx.fill();

      // Draw white background for QR code with rounded corners
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.roundRect(padding, headerHeight + padding / 2, qrImage.width, qrImage.height, 8);
      ctx.fill();

      // Draw QR code
      ctx.drawImage(qrImage, padding, headerHeight + padding / 2);

      // Add center image if available
      if (centerImage) {
        const logoImg = new Image();
        logoImg.onload = () => {
          // Calculate logo size (about 20% of QR code)
          const logoSize = qrImage.width * 0.2;
          const logoX = padding + (qrImage.width - logoSize) / 2;
          const logoY = headerHeight + padding / 2 + (qrImage.height - logoSize) / 2;

          // Draw white background for logo
          ctx.fillStyle = "#FFFFFF";
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
          ctx.fill();

          // Draw logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
          ctx.restore();

          // Add "SCAN ME" text
          ctx.fillStyle = "#FFFFFF";
          ctx.font = "bold 24px Arial";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("SCAN ME", canvas.width / 2, headerHeight / 2 + padding / 2);

          // Convert to data URL and download
          const dataUrl = canvas.toDataURL("image/png")
          const link = document.createElement("a")
          link.href = dataUrl
          link.download = "qrcode.png"
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
        }
        logoImg.crossOrigin = "anonymous"
        logoImg.src = centerImage
      } else {
        // Add "SCAN ME" text
        ctx.fillStyle = "#FFFFFF"
        ctx.font = "bold 24px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("SCAN ME", canvas.width / 2, headerHeight / 2 + padding / 2)

        // Convert to data URL and download
        const dataUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.href = dataUrl
        link.download = "qrcode.png"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    }

    qrImage.src = qrCode
  }

  const renderQRCode = () => {
    if (!qrCode) return null

    return (
      <div className="flex flex-col items-center pt-4">
        <div className="overflow-hidden rounded-xl bg-black" style={{ maxWidth: "320px" }}>
          {showScanText && (
            <div className="w-full bg-black text-white font-bold pt-3 text-center text-5xl tracking-wider uppercase">
              SCAN ME
            </div>
          )}
          <div className="p-3 bg-black">
            <div className="bg-white p-1 rounded-lg relative">
              <img src={qrCode || "/placeholder.svg"} alt="QR Code" className="w-full h-auto" />

              {centerImage && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white p-1 rounded-lg ring-2 ring-black">
                    <img
                      src={centerImage || "/placeholder.svg"}
                      alt="Center Logo"
                      className="w-36 h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">QR Code Generator</CardTitle>
          <CardDescription>Enter a URL to generate a QR code</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />

            <div className="flex items-center space-x-2 mt-4">
              <Checkbox id="scanText" checked={showScanText} onCheckedChange={setShowScanText} defaultChecked />
              <Label htmlFor="scanText" className="text-sm font-normal">
                Add "SCAN ME" text to QR code
              </Label>
            </div>

            <div className="mt-4">
              <Label htmlFor="centerImage" className="block mb-2">
                Center Image (Optional)
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <Input
                    id="centerImage"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon size={16} />
                    {centerImage ? "Change Image" : "Upload Image"}
                  </Button>
                </div>

                {centerImage && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={clearCenterImage}
                    className="flex-shrink-0"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">For best results, use a square image (JPG, PNG)</p>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>

          <Button className="w-full" onClick={generateQRCode} disabled={isGenerating}>
            {isGenerating ? "Generating..." : "Generate QR Code"}
          </Button>

          {renderQRCode()}
        </CardContent>

        {qrCode && (
          <CardFooter>
            <Button className="w-full" variant="outline" onClick={downloadQRCode}>
              Download QR Code
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
