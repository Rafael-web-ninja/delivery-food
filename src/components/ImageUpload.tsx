import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, ImageIcon } from 'lucide-react';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImage = async (file: File) => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${folder}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      onUrlChange(urlData.publicUrl);
      
      toast({
        title: "Upload realizado!",
        description: "Imagem enviada com sucesso",
      });
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive"
      });
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
          accept="image/*"
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
      
      {/* Preview */}
      {currentUrl && (
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