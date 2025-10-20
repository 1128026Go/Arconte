import MainLayout from '../components/Layout/MainLayout';
import AudioTranscriber from '../components/AudioTranscriber';

export default function Transcriptions() {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-primary-900">Transcripciones de Audio/Video</h1>
          <p className="text-primary-600 mt-2">
            Sube archivos de audio o video y obtén transcripciones automáticas con resúmenes generados por IA
          </p>
        </div>

        <AudioTranscriber />
      </div>
    </MainLayout>
  );
}
