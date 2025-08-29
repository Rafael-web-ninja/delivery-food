import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Download, Printer, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QRCodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  businessName?: string;
}

const QRCodeDialog = ({ open, onOpenChange, url, businessName = "Cardápio" }: QRCodeDialogProps) => {
  const { toast } = useToast();
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSize, setQrSize] = useState<string>('512');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && url) {
      generateQRCode();
    }
  }, [open, url, qrSize]);

  const generateQRCode = async () => {
    setLoading(true);
    try {
      const dataUrl = await QRCode.toDataURL(url, {
        width: parseInt(qrSize),
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar o QR Code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Sucesso",
        description: "Link copiado com sucesso!",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;

    const link = document.createElement('a');
    link.download = `qrcode-${businessName.toLowerCase().replace(/\s+/g, '-')}-${qrSize}px.png`;
    link.href = qrDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Sucesso",
      description: "QR Code baixado com sucesso!",
    });
  };

  const printQR = () => {
    if (!qrDataUrl) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Erro",
        description: "Não foi possível abrir a janela de impressão",
        variant: "destructive",
      });
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${businessName}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 20px;
              margin: 0;
            }
            .qr-container {
              display: inline-block;
              border: 2px solid #000;
              padding: 20px;
              margin: 20px;
              background: white;
            }
            .qr-title {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 15px;
              color: #000;
            }
            .qr-image {
              display: block;
              margin: 0 auto 15px;
            }
            .qr-url {
              font-size: 12px;
              color: #666;
              word-break: break-all;
              margin-top: 10px;
            }
            @media print {
              body { margin: 0; }
              .qr-container { border: 2px solid #000; }
            }
          </style>
        </head>
        <body>
          <div class="qr-container">
            <div class="qr-title">${businessName}</div>
            <img src="${qrDataUrl}" alt="QR Code" class="qr-image" />
            <div class="qr-url">${url}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    toast({
      title: "Sucesso",
      description: "QR Code enviado para impressão!",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            QR Code do seu Cardápio
          </DialogTitle>
          <DialogDescription>
            Escaneie para acessar o cardápio ou compartilhe em suas redes sociais
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tamanho do QR */}
          <div className="space-y-2">
            <Label htmlFor="qr-size">Tamanho</Label>
            <Select value={qrSize} onValueChange={setQrSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="256">Pequeno (256px)</SelectItem>
                <SelectItem value="512">Médio (512px)</SelectItem>
                <SelectItem value="1024">Grande (1024px)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview do QR Code */}
          <div className="flex justify-center p-4 bg-white rounded-lg border">
            {loading ? (
              <div className="w-48 h-48 bg-muted animate-pulse rounded" />
            ) : qrDataUrl ? (
              <img 
                src={qrDataUrl} 
                alt="QR Code do Cardápio" 
                className="max-w-48 max-h-48 object-contain"
              />
            ) : (
              <div className="w-48 h-48 bg-muted flex items-center justify-center rounded">
                <QrCode className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* URL do cardápio */}
          <div className="space-y-2">
            <Label htmlFor="menu-url">Link do Cardápio</Label>
            <div className="flex gap-2">
              <Input
                id="menu-url"
                value={url}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button variant="outline" size="sm" onClick={copyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={downloadQR}
              disabled={!qrDataUrl || loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PNG
            </Button>
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={printQR}
              disabled={!qrDataUrl || loading}
            >
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDialog;