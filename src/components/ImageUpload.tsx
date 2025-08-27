import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, ImageIcon, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { optimizeImage } from '@/lib/imageOptimizer';

interface ImageUploadProps {
  currentUrl: string;
  onUrlChange: (url: string) => void;
  label: string;
  bucketName?: string;
  folder?: string;
}

export default function ImageUpload({ 
  currentUrl, 
  onUrlChange, 
  label, 
  bucketName = 'menu-images',
  folder = 'logos' 
}: ImageUploadProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);


  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      // Usar o utilitário centralizado de otimização
      const result = await optimizeImage(file);
      
      // Gerar preview
      const previewUrl = URL.createObjectURL(result.file);
      setPreviewUrl(previewUrl);

      const fileName = `${folder}/${Date.now()}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, result.file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      onUrlChange(urlData.publicUrl);
      
      toast({
        title: "Upload realizado!",
        description: `Imagem otimizada: ${Math.round(result.originalSize / 1024)}KB → ${Math.round(result.finalSize / 1024)}KB (${result.compressionRatio.toFixed(1)}% redução)`,
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
      setPreviewUrl('');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      uploadImage(file);
    } else {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione uma imagem",
        variant: "destructive"
      });
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      
      {/* Recomendações */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Recomendamos imagens em 600x427px até 1MB para melhor desempenho do cardápio. Todas as imagens são automaticamente otimizadas para WEBP (~150KB).
        </AlertDescription>
      </Alert>
      
      {/* URL Input */}
      <Input
        value={currentUrl}
        onChange={(e) => onUrlChange(e.target.value)}
        placeholder="https://exemplo.com/logo.png ou faça upload abaixo"
      />
      
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver 
            ? 'border-primary bg-primary/10' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="flex flex-col items-center gap-2">
          <ImageIcon className="h-8 w-8 text-gray-400" />
          <p className="text-sm text-gray-600">
            Arraste uma imagem aqui ou
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={openFileDialog}
            disabled={uploading}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
          </Button>
        </div>
      </div>
      
      {/* Preview da imagem otimizada */}
      {previewUrl && (
        <div className="mt-4">
          <Label className="text-sm text-gray-600">Preview da imagem otimizada:</Label>
          <div className="mt-2 p-2 border rounded-lg bg-gray-50">
            <img 
              src={previewUrl} 
              alt="Preview otimizado" 
              className="max-h-32 mx-auto object-contain"
            />
          </div>
        </div>
      )}
      
      {/* Preview da URL atual */}
      {currentUrl && !previewUrl && (
        <div className="mt-4">
          <Label className="text-sm text-gray-600">Preview:</Label>
          <div className="mt-2 p-2 border rounded-lg">
            <img 
              src={currentUrl} 
              alt="Preview" 
              className="max-h-32 mx-auto object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}