import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function LinearRegressionSSE() {
  const ModelState = {
    NONE: 'NONE',
    TRAINED: 'TRAINED',
    TRAINING: 'TRAINING',
    FILE_LOADED: 'FILE_LOADED',
    FILE_PROCESSED: 'FILE_PROCESSED',
    ERROR: 'ERROR'
  };
  const [data, setData] = useState([]);
  const [m, setM] = useState(null);
  const [b, setB] = useState(null);
  const [iteration, setIteration] = useState(0);
  const [rmse, setRmse] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [status, setStatus] = useState(ModelState.NONE);
  const eventSourceRef = useRef(null);
  const [csvFile, setCsvFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [iterations, setIterations] = useState(1000);
  const [learningRate, setLearningRate] = useState(0.01);
  const [currentLearningRate, setCurrentLearningRate] = useState(0.01);
  const [predictX, setPredictX] = useState('');
  const [predictedY, setPredictedY] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'info') => {
      const id = Date.now();
      const newToast = { id, message, type };
      setToasts(prev => [...prev, newToast]);
      
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 4000);
    };

  const getDataTrain = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/linear-regression/data-train');
      if (response.status === 204) {
        return;
      }
      if (!response.ok) {
        throw new Error('No se pudo obtener los datos para entrenar');
      } 
      const result = await response.json();
      
      if (result) {
        setData(result);
        setStatus(ModelState.FILE_PROCESSED);
      }
    } catch (e) {
      setStatus(ModelState.ERROR);
      showToast("No se pudo obtener los datos para entrenar", 'error');
    }
  }

  const connectSSE = async () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (data.length === 0) {
      await getDataTrain();
    }

    const eventSource = new EventSource('http://localhost:3000/api/linear-regression/train');
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      setIsConnected(true);
      setStatus(ModelState.TRAINING);
    };

    eventSource.addEventListener('iteration', (event) => {
      try {
        const result = JSON.parse(event.data);
        setM(result.m);
        setB(result.b);
        setIteration(result.iteration);
        setStatus(ModelState.TRAINING);
      } catch (error) {
        showToast('Error parsing iteration data:', 'error');
      }
    });

    eventSource.addEventListener('complete', (event) => {
      setStatus(ModelState.TRAINED);
      disconnect();
      setIsConnected(false);
      showToast('Modelo entrenado', 'success');
    });
  };

  const disconnect = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  };

  const reset = async () => {
    await resetModel();
  };

  const resetModel = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/linear-regression/reset');

      if (!response.ok) throw new Error('Error al reiniciar el modelo');
      const result = await response.json();
      if (result.iterations) setIterations(result.iterations);
      if (result.learningRate) setLearningRate(result.learningRate);

      showToast('Modelo reseteado', 'success');
      setData([]);
      setM(null);
      setB(null);
      setIteration(0);
      setCsvFile(null);
      setPredictedY(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatus(ModelState.NONE);

    } catch (e) {
      showToast('No se pudo reiniciar el modelo', 'error')
    }
  }
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setStatus(ModelState.FILE_LOADED);
    } else {
      showToast('Por favor selecciona un archivo CSV válido', 'error');
      setCsvFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setCsvFile(file);
      setStatus(ModelState.FILE_LOADED);
    } else {
      alershowToastt('Por favor arrastra un archivo CSV válido', 'warning');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const uploadCSV = async () => {
    if (!csvFile) {
      showToast('Por favor selecciona un archivo CSV primero', 'warning');
      return;
    }

    setUploading(true);
    setStatus(ModelState.FILE_LOADED);

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      const response = await fetch('http://localhost:3000/api/linear-regression/update-data-train', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir el archivo');
      }

      const result = await response.json();
      
      if (result) {
        setData(result);
        setStatus(ModelState.FILE_PROCESSED);
      }
      showToast('Archivo procesado', 'success')
      setCsvFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (error) {
      console.error('Error uploading CSV:', error);
      setStatus(ModelState.ERROR);
      showToast('Error al subir el archivo. Verifica la conexión con el servidor.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const updateIterations = async () => {
    setUpdating(true);
    try {
      const response = await fetch('http://localhost:3000/api/linear-regression/update-iterations?iterations='+iterations, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Error al actualizar iteraciones');
      }

      showToast(`Iteraciones actualizadas a: ${iterations}`, 'success');
    } catch (error) {
      console.error('Error updating iterations:', error);
      showToast('Error al actualizar iteraciones', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const updateLearningRate = async () => {
    setUpdating(true);
    try {
      const response = await fetch('http://localhost:3000/api/linear-regression/update-learning-rate?learningRate='+learningRate, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Error al actualizar learning rate');
      }

      setCurrentLearningRate(learningRate);
      showToast(`Learning Rate actualizado a: ${learningRate}`, 'success');
    } catch (error) {
      console.error('Error updating learning rate:', error);
      showToast('Error al actualizar learning rate', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const getRMSE = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/linear-regression/precision');

      if (!response.ok) {
        throw new Error('Error al solicitar precision del algoritmo ');
      }
      const body = await response.json();
      if (body.RMSE) setRmse(body.RMSE);
    } catch (error) {
      console.error('Error :', error);
      showToast('Error al solicitar precision del algoritmo ', 'error');
    }
  };

  const predictValue = async () => {
    if (!predictX || isNaN(predictX)) {
      showToast('Por favor ingresa un valor numérico válido', 'warning');
      return;
    }

    setUpdating(true);
    try {
      const response = await fetch('http://localhost:3000/api/linear-regression/predict?x='+predictX);

      if (!response.ok) {
        throw new Error('Error al predecir');
      }

      const result = await response.json();
      setPredictedY(Number(result.y));
    } catch (error) {
      console.error('Error predicting:', error);
      showToast('Error al predecir. Asegúrate de que el modelo esté entrenado.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await getModelState();
      await getDataTrain();
      await getModelConfig();
    };

    init();
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const getModelConfig = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/linear-regression/config');

      if (!response.ok) {
        throw new Error('Error al predecir');
      }

      const result = await response.json();
      if (result.iterations) setIterations(result.iterations);
      if (result.learningRate) setLearningRate(result.learningRate);
    } catch (error) {
      console.error('Error predicting:', error);
      showToast("Error al obtener el estado del modelo",  "error");

    }
  }

  const getModelState = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/linear-regression/state');

      if (!response.ok) {
        throw new Error('Error al predecir');
      }

      const result = await response.json();
      if (result.modelState) {
        setStatus(result.modelState);
      }
    } catch (error) {
      console.error('Error predicting:', error);
      showToast('Error al obtener el estado del modelo.', 'error');
    }
  }

  const getRegressionLine = () => {
    if (m === null || b === null || data.length === 0) return [];
    
    const minX = Math.min(...data.map(d => d.x));
    const maxX = Math.max(...data.map(d => d.x));
    
    const points = [];
    const step = (maxX - minX) / 100;
    
    for (let x = minX; x <= maxX; x += step) {
      points.push({
        millas: x,
        prediccion: m * x + b
      });
    }
    
    return points;
  };

  const getCombinedData = () => {
    const regressionLine = getRegressionLine();
    const realData = data.map(d => ({
      millas: d.x,
      real: d.y,
      prediccion: null
    }));
    
    const lineData = regressionLine.map(d => ({
      millas: d.millas,
      real: null,
      prediccion: d.prediccion
    }));
    
    return [...realData, ...lineData].sort((a, b) => a.millas - b.millas);
  };

  const combinedData = getCombinedData();

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    
    if (payload.real !== null) {
      return (
        <circle 
          cx={cx} 
          cy={cy} 
          r={5} 
          fill="#3b82f6" 
          stroke="#1e40af"
          strokeWidth={2}
        />
      );
    }
    return null;
  };
  const getToastStyles = (type) => {
    const styles = {
      success: 'bg-green-500 border-green-600',
      error: 'bg-red-500 border-red-600',
      warning: 'bg-yellow-500 border-yellow-600',
      info: 'bg-blue-500 border-blue-600'
    };
    return styles[type] || styles.info;
  };

  const getToastIcon = (type) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    return icons[type] || icons.info;
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
           {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`${getToastStyles(toast.type)} text-white px-6 py-4 rounded-lg shadow-lg border-l-4 flex items-center gap-3 animate-slide-in`}
            style={{
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <span className="text-2xl">{getToastIcon(toast.type)}</span>
            <p className="flex-1 font-medium">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-white hover:text-gray-200 transition"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slideIn 0.3s ease-out;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                🤖 Regresión Lineal
              </h1>
              <p className="text-gray-600">
                Entrena modelos predictivos con tus datos en tiempo real
              </p>
            </div>
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-lg text-center">
              <p className="text-sm font-medium">Estado</p>
              <p className="text-lg font-bold">{status}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda - Controles */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* 1. Subir Datos */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">Paso 1: Datos</h3>
                  <p className="text-xs text-gray-500">Carga tu archivo CSV</p>
                </div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 mb-4 border-2 border-dashed border-purple-300">
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-purple-300 rounded-lg p-6 text-center bg-white hover:bg-purple-50 transition cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="mx-auto h-10 w-10 text-purple-400 mb-2" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="text-purple-700 font-medium text-sm mb-1">
                    {csvFile ? csvFile.name : 'Arrastra tu CSV aquí'}
                  </p>
                  <p className="text-purple-500 text-xs">
                    o haz clic para seleccionar
                  </p>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>
              </div>

              <button
                onClick={uploadCSV}
                disabled={!csvFile || uploading}
                className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                  !csvFile || uploading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                }`}
              >
                {uploading ? ' Subiendo...' : ' Subir Datos'}
              </button>
            </div>

            {/* 2. Configuración */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">Paso 2: Configuración</h3>
                  <p className="text-xs text-gray-500">Ajusta los parámetros</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Iteraciones
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={iterations}
                      onChange={(e) => setIterations(parseInt(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="1000"
                      min="1"
                    />
                    <button
                      onClick={updateIterations}
                      disabled={updating || isConnected}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                        updating || isConnected
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      ✓
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Learning Rate
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.001"
                      value={learningRate}
                      onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="0.01"
                      min="0.0001"
                      max="1"
                    />
                    <button
                      onClick={updateLearningRate}
                      disabled={updating || isConnected}
                      className={`px-3 py-2 rounded-lg text-sm font-semibold transition ${
                        updating || isConnected
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      ✓
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Actual: {currentLearningRate}</p>
                </div>
              </div>
            </div>

            {/* 3. Entrenamiento */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">Paso 3: Entrenar</h3>
                  <p className="text-xs text-gray-500">Inicia el modelo</p>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={connectSSE}
                  disabled={isConnected || status !== ModelState.FILE_PROCESSED}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                    (isConnected || status !== ModelState.FILE_PROCESSED)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                  }`}
                >
                  {isConnected ? 'Entrenando...' : 'Entrenar Modelo'}
                </button>

                <button
                  onClick={getRMSE}
                  disabled={status !== ModelState.TRAINED}
                  className={`w-full px-4 py-2 rounded-lg font-semibold transition ${
                    (status !== ModelState.TRAINED)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                  }`}
                >
                 Ver Precisión
                </button>

                <button
                  onClick={reset}
                  className="w-full px-4 py-2 rounded-lg font-semibold bg-gray-600 text-white hover:bg-gray-700 transition shadow-md"
                >
                 Reiniciar
                </button>
              </div>

              {/* Métricas */}
              <div className="mt-4 bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Iteración:</span>
                  <span className="font-bold text-gray-800">{iteration}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">RMSE:</span>
                  <span className="font-bold text-gray-800">{rmse || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* 4. Predicción */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <div>
                  <h3 className="font-bold text-gray-800">Paso 4: Predecir</h3>
                  <p className="text-xs text-gray-500">Obtén resultados</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor de X (millas)
                  </label>
                  <input
                    type="number"
                    value={predictX}
                    onChange={(e) => setPredictX(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ej: 50000"
                  />
                </div>
                
                <button
                  onClick={predictValue}
                  disabled={updating || !predictX || status !== ModelState.TRAINED}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                    updating || !predictX || status !== ModelState.TRAINED
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md'
                  }`}
                >
                 Predecir Precio
                </button>

                {predictedY !== null && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg border-2 border-orange-300">
                    <p className="text-xs text-gray-600 mb-1">Predicción:</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${predictedY.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Para {predictX} millas
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Ecuación */}
            {m !== null && b !== null && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  Ecuación
                </h3>
                <div className="bg-indigo-50 rounded-lg p-4">
                  <p className="text-lg font-mono text-indigo-700 text-center">
                    y = {m.toFixed(4)}x + {b.toFixed(4)}
                  </p>
                  <p className="text-xs text-indigo-600 text-center mt-2">
                    precio = {m.toFixed(4)} × millas + {b.toFixed(4)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Columna Derecha - Gráfica */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6 h-full">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                Visualización del Modelo
              </h2>
              
              {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-gray-500 text-lg font-medium">
                    Esperando datos...
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Sube un archivo CSV para comenzar
                  </p>
                </div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={500}>
                    <LineChart data={combinedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                      <XAxis 
                        dataKey="millas" 
                        type="number" 
                        domain={['dataMin - 5000', 'dataMax + 5000']}
                        label={{ value: 'Millas', position: 'insideBottom', offset: -10 }}
                      />
                      <YAxis 
                        label={{ value: 'Precio ($)', angle: -90, position: 'insideLeft' }}
                        domain={['dataMin - 2000', 'dataMax + 2000']}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'white', border: '1px solid #ccc', borderRadius: '8px' }}
                        formatter={(value, name) => {
                          if (value === null) return null;
                          return [value.toFixed(2), name === 'real' ? 'Precio Real' : 'Predicción'];
                        }}
                      />
                      <Legend />
                      
                      <Line 
                        dataKey="real" 
                        stroke="transparent"
                        dot={<CustomDot />}
                        name="Datos Reales"
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                      
                      {m !== null && b !== null && (
                        <Line 
                          dataKey="prediccion" 
                          stroke="#ef4444" 
                          strokeWidth={3}
                          dot={false}
                          name="Línea de Regresión"
                          connectNulls={true}
                          isAnimationActive={true}
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-center gap-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-blue-800"></div>
                        <span className="text-sm font-medium text-gray-700">Datos Reales</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-1 bg-red-500 rounded"></div>
                        <span className="text-sm font-medium text-gray-700">Predicción</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Total de puntos:</span>
                          <span className="font-semibold text-gray-800 ml-2">{data.length}</span>
                        </div>
                        {m !== null && b !== null && (
                          <div className="col-span-2">
                            <span className="text-gray-600">Función:</span>
                            <p className="font-mono text-gray-800 mt-1 text-xs">
                              precio(millas) = {m.toFixed(4)} × millas + {b.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}