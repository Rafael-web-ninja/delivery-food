export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface OptimizationResult {
  file: File;
  originalSize: number;
  finalSize: number;
  compressionRatio: number;
  dimensions: { width: number; height: number };
}

/**
 * Validação de arquivo de imagem
 */
export const validateImage = (file: File): ImageValidationResult => {
  // Validar formato
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Formato não permitido. Use apenas JPG, PNG ou WEBP.'
    };
  }

  // Permitir qualquer tamanho original - vamos otimizar
  return { isValid: true };
};

/**
 * Redimensiona imagem mantendo proporção para 600x427px
 */
export const resizeToTarget = (
  file: File, 
  targetWidth = 600, 
  targetHeight = 427
): Promise<HTMLCanvasElement> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Não foi possível criar contexto do canvas'));
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      console.log(`📐 Dimensões originais: ${img.width}x${img.height}`);
      
      // Calcular dimensões mantendo proporção
      const aspectRatio = img.width / img.height;
      const targetRatio = targetWidth / targetHeight;
      
      let finalWidth = targetWidth;
      let finalHeight = targetHeight;
      
      if (aspectRatio > targetRatio) {
        // Imagem mais larga - limitar pela largura
        finalHeight = targetWidth / aspectRatio;
      } else {
        // Imagem mais alta - limitar pela altura
        finalWidth = targetHeight * aspectRatio;
      }

      canvas.width = finalWidth;
      canvas.height = finalHeight;
      
      // Desenhar imagem redimensionada
      ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
      
      console.log(`📐 Dimensões finais: ${finalWidth}x${finalHeight}`);
      resolve(canvas);
    };

    img.onerror = () => {
      reject(new Error('Erro ao carregar imagem'));
    };

    img.src = URL.createObjectURL(file);
  });
};

/**
 * Compressão iterativa para atingir tamanho alvo (~150KB)
 */
export const compressToWebpWithTargetSize = (
  canvas: HTMLCanvasElement,
  targetKB = 150,
  minQuality = 0.4,
  maxQuality = 0.8
): Promise<File> => {
  return new Promise((resolve, reject) => {
    const targetBytes = targetKB * 1024;
    const maxBytes = 1024 * 1024; // 1MB máximo absoluto
    
    let quality = maxQuality;
    let attempts = 0;
    const maxAttempts = 8;

    const tryCompress = () => {
      attempts++;
      console.log(`🔄 Tentativa ${attempts}: qualidade ${quality.toFixed(2)}`);
      
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Falha ao gerar blob da imagem'));
          return;
        }

        const sizeMB = (blob.size / (1024 * 1024)).toFixed(2);
        const sizeKB = Math.round(blob.size / 1024);
        console.log(`📏 Tamanho gerado: ${sizeKB}KB (${sizeMB}MB)`);

        // Se passou do limite absoluto, rejeitar
        if (blob.size > maxBytes) {
          reject(new Error(`Imagem muito grande mesmo após otimização (${sizeKB}KB). Tente uma imagem menor.`));
          return;
        }

        // Se está no tamanho ideal ou atingiu limites de tentativas/qualidade
        if (blob.size <= targetBytes || attempts >= maxAttempts || quality <= minQuality) {
          const finalFile = new File([blob], `optimized_${Date.now()}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          
          console.log(`✅ Otimização concluída: ${sizeKB}KB, qualidade ${quality.toFixed(2)}`);
          resolve(finalFile);
          return;
        }

        // Reduzir qualidade para próxima tentativa
        quality = Math.max(minQuality, quality - 0.1);
        tryCompress();
      }, 'image/webp', quality);
    };

    tryCompress();
  });
};

/**
 * Pipeline completo de otimização
 */
export const optimizeImage = async (file: File): Promise<OptimizationResult> => {
  const originalSize = file.size;
  
  console.log(`🚀 Iniciando otimização de: ${file.name} (${Math.round(originalSize / 1024)}KB)`);
  
  // 1. Validar imagem
  const validation = validateImage(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // 2. Redimensionar para 600x427 proporcional
  const canvas = await resizeToTarget(file);
  
  // 3. Comprimir iterativamente para ~150KB
  const optimizedFile = await compressToWebpWithTargetSize(canvas);
  
  const finalSize = optimizedFile.size;
  const compressionRatio = ((originalSize - finalSize) / originalSize * 100);
  
  console.log(`🎯 Resultado final: ${Math.round(originalSize / 1024)}KB → ${Math.round(finalSize / 1024)}KB (${compressionRatio.toFixed(1)}% redução)`);
  
  return {
    file: optimizedFile,
    originalSize,
    finalSize,
    compressionRatio,
    dimensions: { width: canvas.width, height: canvas.height }
  };
};