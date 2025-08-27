import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, ImageIcon, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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

  const validateFile = (file: File): string | null => {
    // Validar formato
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return 'Formato não permitido. Use apenas JPG, PNG ou WEBP.';
    }

    // Validar tamanho (1MB)
    const maxSize = 1 * 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Máximo permitido: 1MB.';
    }

    return null;
  };

  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();

      img.onload = () => {
        const targetWidth = 600;
        const targetHeight = 427;
        
        // Calcular dimensões mantendo proporção
        const aspectRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        
        let finalWidth = targetWidth;
        let finalHeight = targetHeight;
        
        if (aspectRatio > targetRatio) {
          finalHeight = targetWidth / aspectRatio;
        } else {
          finalWidth = targetHeight * aspectRatio;
        }

        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          }
        }, 'image/webp', 0.7);
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      // Validar arquivo
      const validationError = validateFile(file);
      if (validationError) {
        throw new Error(validationError);
      }

      // Redimensionar e otimizar imagem
      const optimizedFile = await resizeImage(file);
      
      // Gerar preview
      const previewUrl = URL.createObjectURL(optimizedFile);
      setPreviewUrl(previewUrl);

      const fileName = `${folder}/${Date.now()}.webp`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, optimizedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      onUrlChange(urlData.publicUrl);
      
      toast({
        title: "Upload realizado!",
        description: "Imagem otimizada e enviada com sucesso",
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
          Recomendamos imagens em 600x427px até 1MB para melhor desempenho do cardápio.
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