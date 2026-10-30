// emailService.js
// Uses EmailJS - configure with your own Service ID, Template IDs and Public Key
// Sign up at https://www.emailjs.com (free plan: 200 emails/month)

const EMAILJS_SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID  || 'service_mcvd';
const EMAILJS_PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  || 'YOUR_PUBLIC_KEY';
const TEMPLATE_CONFIRM    = import.meta.env.VITE_EMAILJS_TEMPLATE_CONFIRM || 'template_confirm';
const TEMPLATE_REMINDER   = import.meta.env.VITE_EMAILJS_TEMPLATE_REMINDER || 'template_reminder';
const TEMPLATE_FORM_LINK  = import.meta.env.VITE_EMAILJS_TEMPLATE_FORM   || 'template_form';
const TEMPLATE_BUDGET     = import.meta.env.VITE_EMAILJS_TEMPLATE_BUDGET  || 'template_budget';

let emailjsLoaded = false;

async function loadEmailJS() {
  if (emailjsLoaded) return;
  const { default: emailjs } = await import('@emailjs/browser');
  emailjs.init(EMAILJS_PUBLIC_KEY);
  emailjsLoaded = true;
  return emailjs;
}

/**
 * Send appointment confirmation email
 */
export async function sendAppointmentConfirmation({ patientName, patientEmail, date, time, service, clinicPhone = '', clinicAddress = '' }) {
  try {
    const emailjs = await loadEmailJS();
    const params = {
      to_name: patientName,
      to_email: patientEmail,
      appointment_date: new Date(date).toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      appointment_time: time,
      service,
      clinic_phone: clinicPhone,
      clinic_address: clinicAddress,
    };
    const result = await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_CONFIRM, params);
    return { success: true, result };
  } catch (error) {
    console.error('EmailJS error:', error);
    return { success: false, error: error.message || 'Error al enviar el correo' };
  }
}

/**
 * Send appointment reminder (24h before)
 */
export async function sendAppointmentReminder({ patientName, patientEmail, date, time, service }) {
  try {
    const emailjs = await loadEmailJS();
    const params = {
      to_name: patientName,
      to_email: patientEmail,
      appointment_date: new Date(date).toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      appointment_time: time,
      service,
    };
    const result = await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_REMINDER, params);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send patient form link so they can pre-fill their clinical history
 */
export async function sendPatientFormLink({ patientName, patientEmail, patientId, clinicName = 'Clínica MCVD' }) {
  try {
    const emailjs = await loadEmailJS();
    const formUrl = `${window.location.origin}/paciente/ficha/${patientId}`;
    const params = {
      to_name: patientName,
      to_email: patientEmail,
      form_url: formUrl,
      clinic_name: clinicName,
    };
    const result = await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_FORM_LINK, params);
    return { success: true, result, formUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send budget by email
 */
export async function sendBudgetEmail({ patientName, patientEmail, totalUSD, totalVES, items, clinicName = 'Clínica MCVD' }) {
  try {
    const emailjs = await loadEmailJS();
    const itemsList = items.map(i => `• ${i.name} (x${i.qty}): $${(i.priceUSD * i.qty).toFixed(2)}`).join('\n');
    const params = {
      to_name: patientName,
      to_email: patientEmail,
      items_list: itemsList,
      total_usd: totalUSD.toFixed(2),
      total_ves: totalVES.toLocaleString('es-VE'),
      clinic_name: clinicName,
      date: new Date().toLocaleDateString('es-VE'),
    };
    const result = await emailjs.send(EMAILJS_SERVICE_ID, TEMPLATE_BUDGET, params);
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
