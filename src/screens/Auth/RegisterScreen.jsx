import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { API_CONFIG, buildApiUrl } from '../../config/config';
import { useAuth } from '../../hooks/useAuth';

export default function RegisterScreen() {
  const navigation = useNavigation();
  const { register, loading } = useAuth();
  const [currentSection, setCurrentSection] = useState(0);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  
  const [form, setForm] = useState({
    // Información Personal
    nombreCompleto: '',
    dni: '',
    nacimiento: '2000-01-01', // Usar string en formato YYYY-MM-DD
    celular: '',
    email: '',
    password: '',
    
    // Dirección
    ciudad: '',
    calle: '',
    numero: '',
    
    // Vehículo
    vehiculoIdVehiculo: 1,
    tipoVehiculo: 'Moto',
    
    // Datos Bancarios
    cvu: '',
    
    // Campos con valores por defecto del sistema
    cantPedidos: 0,
    puntuacion: 5.0,
    libreRepartidor: true
  });

  // Opciones de vehículos
  const vehiculos = [
    { id: 1, tipo: 'Moto', descripcion: 'Motocicleta' },
    { id: 2, tipo: 'Bicicleta', descripcion: 'Bicicleta' },
    { id: 3, tipo: 'Auto', descripcion: 'Automóvil' }
  ];

  const handleChange = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const selectVehicle = (vehicle) => {
    handleChange('vehiculoIdVehiculo', vehicle.id);
    handleChange('tipoVehiculo', vehicle.tipo);
    setShowVehicleModal(false);
  };

  const validateSection = (section) => {
    if (section === 0) {
      if (!form.nombreCompleto.trim()) {
        Alert.alert('Error', 'El nombre completo es requerido');
        return false;
      }
      if (!form.dni.trim()) {
        Alert.alert('Error', 'El DNI es requerido');
        return false;
      }
      if (!form.nacimiento.trim()) {
        Alert.alert('Error', 'La fecha de nacimiento es requerida');
        return false;
      }
      if (!isValidDate(form.nacimiento)) {
        Alert.alert('Error', 'La fecha de nacimiento no es válida (usar formato YYYY-MM-DD)');
        return false;
      }
      if (!form.celular.trim()) {
        Alert.alert('Error', 'El celular es requerido');
        return false;
      }
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
        Alert.alert('Error', 'Ingresa un email válido');
        return false;
      }
      if (!form.password || form.password.length < 6) {
        Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
        return false;
      }
    }
    
    if (section === 1) {
      if (!form.ciudad.trim()) {
        Alert.alert('Error', 'La ciudad es requerida');
        return false;
      }
      if (!form.calle.trim()) {
        Alert.alert('Error', 'La calle es requerida');
        return false;
      }
      if (!form.numero.trim() || isNaN(form.numero)) {
        Alert.alert('Error', 'El número es requerido y debe ser válido');
        return false;
      }
    }
    
    if (section === 2) {
      if (!form.vehiculoIdVehiculo) {
        Alert.alert('Error', 'Selecciona un tipo de vehículo');
        return false;
      }
      if (!form.cvu.trim()) {
        Alert.alert('Error', 'El CVU es requerido para recibir pagos');
        return false;
      }
    }
    
    return true;
  };

  const isValidDate = (dateString) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateString.match(regex)) return false;
    
    const date = new Date(dateString);
    const timestamp = date.getTime();
    
    if (typeof timestamp !== 'number' || Number.isNaN(timestamp)) {
      return false;
    }
    
    return date.toISOString().startsWith(dateString);
  };

  const nextSection = () => {
    if (validateSection(currentSection)) {
      setCurrentSection(prev => prev + 1);
    }
  };

  const prevSection = () => {
    setCurrentSection(prev => prev - 1);
  };

  const calculateAge = (birthDateString) => {
    if (!birthDateString) return 0;
    
    const birthDate = new Date(birthDateString);
    const today = new Date();
    
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleSubmit = async () => {
    if (!validateSection(currentSection)) return;

    // Validar edad mínima (18 años)
    const age = calculateAge(form.nacimiento);
    if (age < 18) {
      Alert.alert('Error', 'Debes ser mayor de 18 años para registrarte como repartidor');
      return;
    }

    const repartidorData = {
      nombreCompleto: form.nombreCompleto,
      dni: form.dni,
      nacimiento: form.nacimiento,
      celular: form.celular,
      ciudad: form.ciudad,
      calle: form.calle,
      numero: parseInt(form.numero) || 0,
      email: form.email,
      password: form.password,
      cvu: form.cvu,
      vehiculoIdVehiculo: form.vehiculoIdVehiculo,
      cantPedidos: 0,
      puntuacion: 5.0,
      libreRepartidor: true
    };

    console.log('Enviando datos del repartidor:', repartidorData);

    const result = await register(repartidorData);
    
    if (result.success) {
      Alert.alert(
        '¡Éxito!', 
        'Repartidor registrado correctamente. Ya puedes iniciar sesión.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
      Alert.alert('Error', result.error);
    }
  };

  const sectionTitles = ['Información', 'Dirección', 'Vehículo & CVU', 'Confirmar'];

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {sectionTitles.map((_, index) => (
        <View key={index} style={styles.progressStep}>
          <View 
            style={[
              styles.progressDot,
              index <= currentSection ? styles.progressDotActive : styles.progressDotInactive
            ]} 
          />
          {index < sectionTitles.length - 1 && (
            <View 
              style={[
                styles.progressLine,
                index < currentSection ? styles.progressLineActive : styles.progressLineInactive
              ]} 
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderSectionTitle = () => (
    <View style={styles.sectionTitleContainer}>
      <Text style={styles.sectionTitle}>
        {sectionTitles[currentSection]}
      </Text>
    </View>
  );

  const VehicleItem = ({ vehicle }) => (
    <TouchableOpacity
      style={[
        styles.vehicleItem,
        form.vehiculoIdVehiculo === vehicle.id && styles.vehicleItemSelected
      ]}
      onPress={() => selectVehicle(vehicle)}
    >
      <Text style={styles.vehicleText}>{vehicle.tipo}</Text>
      <Text style={styles.vehicleDescription}>{vehicle.descripcion}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>DeliveryYa</Text>
            <Text style={styles.subtitle}>Registro de Repartidor</Text>
          </View>

          {/* Progress Bar */}
          {renderProgressBar()}
          {renderSectionTitle()}

          {/* SECCIÓN 1: INFORMACIÓN PERSONAL */}
          {currentSection === 0 && (
            <View style={styles.section}>
              <TextInput
                style={styles.input}
                placeholder="Nombre completo *"
                value={form.nombreCompleto}
                onChangeText={(text) => handleChange('nombreCompleto', text)}
                editable={!loading}
              />
              
              <TextInput
                style={styles.input}
                placeholder="DNI *"
                value={form.dni}
                onChangeText={(text) => handleChange('dni', text)}
                keyboardType="numeric"
                maxLength={8}
                editable={!loading}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Fecha de nacimiento (YYYY-MM-DD) *"
                value={form.nacimiento}
                onChangeText={(text) => handleChange('nacimiento', text)}
                keyboardType="numbers-and-punctuation"
                editable={!loading}
              />
              <Text style={styles.dateHelper}>
                Formato: AAAA-MM-DD (ej: 1990-05-15)
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="Celular *"
                value={form.celular}
                onChangeText={(text) => handleChange('celular', text)}
                keyboardType="phone-pad"
                editable={!loading}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={form.email}
                onChangeText={(text) => handleChange('email', text)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Contraseña *"
                value={form.password}
                onChangeText={(text) => handleChange('password', text)}
                secureTextEntry
                editable={!loading}
              />
            </View>
          )}

          {/* SECCIÓN 2: DIRECCIÓN */}
          {currentSection === 1 && (
            <View style={styles.section}>
              <TextInput
                style={styles.input}
                placeholder="Ciudad *"
                value={form.ciudad}
                onChangeText={(text) => handleChange('ciudad', text)}
                editable={!loading}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Calle *"
                value={form.calle}
                onChangeText={(text) => handleChange('calle', text)}
                editable={!loading}
              />
              
              <TextInput
                style={styles.input}
                placeholder="Número *"
                value={form.numero}
                onChangeText={(text) => handleChange('numero', text)}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          )}

          {/* SECCIÓN 3: VEHÍCULO Y CVU */}
          {currentSection === 2 && (
            <View style={styles.section}>
              <Text style={styles.label}>Tipo de Vehículo *</Text>
              <TouchableOpacity 
                style={styles.vehicleSelector}
                onPress={() => setShowVehicleModal(true)}
                disabled={loading}
              >
                <Text style={styles.vehicleSelectorText}>
                  {form.tipoVehiculo || 'Seleccionar vehículo'}
                </Text>
                <Text style={styles.vehicleSelectorArrow}>▼</Text>
              </TouchableOpacity>
              
              <Text style={styles.cvuInfo}>
                El CVU es necesario para que puedas recibir los pagos de tus entregas
              </Text>
              
              <TextInput
                style={styles.input}
                placeholder="CVU (22 dígitos) *"
                value={form.cvu}
                onChangeText={(text) => handleChange('cvu', text)}
                keyboardType="numeric"
                maxLength={22}
                editable={!loading}
              />
            </View>
          )}

          {/* SECCIÓN 4: CONFIRMACIÓN */}
          {currentSection === 3 && (
            <View style={styles.section}>
              <View style={styles.confirmationCard}>
                <Text style={styles.confirmationTitle}>Resumen de tu registro</Text>
                
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Nombre:</Text>
                  <Text style={styles.confirmationValue}>{form.nombreCompleto}</Text>
                </View>
                
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>DNI:</Text>
                  <Text style={styles.confirmationValue}>{form.dni}</Text>
                </View>
                
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Edad:</Text>
                  <Text style={styles.confirmationValue}>{calculateAge(form.nacimiento)} años</Text>
                </View>
                
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Email:</Text>
                  <Text style={styles.confirmationValue}>{form.email}</Text>
                </View>
                
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Dirección:</Text>
                  <Text style={styles.confirmationValue}>{form.calle} {form.numero}, {form.ciudad}</Text>
                </View>
                
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>Vehículo:</Text>
                  <Text style={styles.confirmationValue}>{form.tipoVehiculo}</Text>
                </View>
                
                <View style={styles.confirmationRow}>
                  <Text style={styles.confirmationLabel}>CVU:</Text>
                  <Text style={styles.confirmationValue}>{form.cvu}</Text>
                </View>
              </View>
              
              <Text style={styles.termsText}>
                Al registrarte, aceptas los términos y condiciones de DeliveryYa para repartidores.
              </Text>
            </View>
          )}

          {/* BOTONES DE NAVEGACIÓN */}
          <View style={styles.navigationButtons}>
            {currentSection > 0 && (
              <TouchableOpacity 
                style={[styles.button, styles.buttonSecondary]}
                onPress={prevSection}
                disabled={loading}
              >
                <Text style={styles.buttonSecondaryText}>Anterior</Text>
              </TouchableOpacity>
            )}
            
            {currentSection < sectionTitles.length - 1 ? (
              <TouchableOpacity 
                style={styles.button}
                onPress={nextSection}
                disabled={loading}
              >
                <Text style={styles.buttonText}>Siguiente</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.buttonText}>Completar Registro</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* LINK PARA VOLVER AL LOGIN */}
          <TouchableOpacity 
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.loginLinkText}>
              ¿Ya tienes cuenta? Inicia sesión
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Vehicle Selection Modal */}
      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecciona tu vehículo</Text>
            <FlatList
              data={vehiculos}
              renderItem={({ item }) => <VehicleItem vehicle={item} />}
              keyExtractor={item => item.id.toString()}
            />
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setShowVehicleModal(false)}
            >
              <Text style={styles.modalCloseText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF4D4D',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF4D4D',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  progressDotActive: {
    backgroundColor: '#FF4D4D',
  },
  progressDotInactive: {
    backgroundColor: '#CCCCCC',
  },
  progressLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#FF4D4D',
  },
  progressLineInactive: {
    backgroundColor: '#CCCCCC',
  },
  sectionTitleContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  section: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    fontSize: 16,
  },
  dateHelper: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 12,
    fontStyle: 'italic',
    marginLeft: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333333',
  },
  vehicleSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DDDDDD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  vehicleSelectorText: {
    fontSize: 16,
    color: '#333333',
  },
  vehicleSelectorArrow: {
    fontSize: 12,
    color: '#666666',
  },
  cvuInfo: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  confirmationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333333',
  },
  confirmationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  confirmationLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  confirmationValue: {
    fontSize: 14,
    color: '#333333',
  },
  termsText: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    flex: 1,
    backgroundColor: '#FF4D4D',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonSecondary: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FF4D4D',
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonSecondaryText: {
    color: '#FF4D4D',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#FF4D4D',
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    maxHeight: '60%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  vehicleItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  vehicleItemSelected: {
    backgroundColor: '#FFF0F0',
  },
  vehicleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  vehicleDescription: {
    fontSize: 14,
    color: '#666666',
  },
  modalClose: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#FF4D4D',
    borderRadius: 8,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});