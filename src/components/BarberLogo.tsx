interface BarberLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function BarberLogo({ size = 'md', className = '' }: BarberLogoProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-12 h-12'
  };

  // Logo personalizado de la barbería
  return (
    <div className={`flex justify-center ${className}`}>
      <img 
        src="/logo-barberia.png" 
        alt="Barbería Dany" 
        className={`${sizes[size]} object-contain rounded-lg`}
        style={{
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
        }}
      />
    </div>
  );
}