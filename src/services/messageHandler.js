import whatsappService from './whatsappService.js';

class MessageHandler {
//ARMAREMOS EL FLUJO, el manejo del estado del appintmen
  constructor(){
    this.appointmentState = {

    };
  }


  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if (this.isGreeting(incomingMessage)){
        await this.sendWelcomeMessage(message.from, message.id, senderInfo);
        //P.3. HACEMOS QUE EL MENU SE PRESENTE (BOTONES) 
        await this.sendWelcomeMenu(message.from);
       //aqui COLOCAMOS EL MEDIA
        } //else if (incomingMessage == 'media'){
          //await this.sendMedia(message.from)
          else if (['audio','video','image','document'].includes(incomingMessage)){
            await this.sendMedia(message.from, incomingMessage);          
        } else{
        const response = `Eco: ${message.text.body}`;
        await whatsappService.sendMessage(message.from, response, message.id);
      }
      await whatsappService.markAsRead(message.id);
    }//P4. VAMOS A VALIDAR UN NUEVO TIPO QUE NO SEA TEXTO SINO DE INTERACCION (BOTON) PARA QUE NO QUEDE PERDIDO
      else if(message?.type === 'interactive'){
        const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
        //QUE HACEMOS CUANDO ESCOGEN UNA OPCION AQUI LO DETERMINAMOS
        await this.handleMenuOption(message.from, option);//la opcion que escoge el usuairo
        await whatsappService.markAsRead(message.id);//ha sido leido este mensaje que lo marque como leido
      }
  }

  isGreeting(meesage){
    const greetings = ["hola", "hi", "buenos dias", "hello", "buenas noches", "buenas tardes"]
    return greetings.includes(meesage);
  }

  //vamos a retomar el valor solo el nombre del usuario
  getSenderName(senderInfo){
    return senderInfo.profile?.name || senderInfo.wa_id || "Hola Estudiante";
  }


  async sendWelcomeMessage(to, messageId, senderInfo){
   //lo vamos a recibir donde esta nuestra logica para extraer el nombre 
    const name = this.getSenderName(senderInfo);
    const firstName = name.split(' ')[0];    
    const formatName = firstName.replace(/[^a-zA-Z\s]/g, '');     
    const welcomeMessage = `Hola ${name}, bienvenido a nuestro Colegio San Miguel Emprendedor. ¿En que puedo ayudarte hoy?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId);
  }

  //AQUI CREAMOS LA LOGICA DE LOS BOTONES
  async sendWelcomeMenu(to) {
    const menuMessage = "Elige una opción"
    const buttons = [
      {
        type: 'reply', reply: {id: 'option_1', title:'Ciclo Verano'}
      },
      {
        type: 'reply', reply: {id: 'option_2', title:'Matrícula 2026'}
      },
      {
        type: 'reply', reply: {id: 'option_3', title:'Ubicación del lugar'}
      }
    ];

    //AHORA ENVIAMOS NUESTRA LOGICA A WSP SERVICE
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }
  //P5. CREAREMOS LA LOGICA DE CUANDO ESCOGEN UNA OPCION
  async handleMenuOption(to, option){
    let response; //ponemos un let para guardar la respuesta
    switch(option.normalize("NFD").replace(/[\u0300-\u036f]/g, "")){ //construiremos las opciones elegida y dentro se acondiciojnara por cada boton
      case 'ciclo verano':
        //AQUI CONTINUAMOS CON EL FLOW, CUANDO LE DEN ciclo verano VAMOS ASIGANR ESTO PASE
        this.appointmentState(to) = {step:'name'}
        //---------------
        response = 'Por favor ingresa tu nombre';
        break;
      case 'matrícula 2026':
        response = 'Los requisitos es gratis';
        break;
      case 'ubicación del lugar':
        response = 'Esta es nuestra ubicación';
        break;
        default: 
          response = 'Lo siento no entendí tu selección por favor elige una de las opciones del menu';
    }
    await whatsappService.sendMessage(to, response);
  }

  //LLAMAR MEDIA      //agregamos el typeuser
  async sendMedia(to, typeUser){
    //estas lineas tmb agregamos para el nuevo
    let type;
    let mediaUrl;
    let caption;

    switch (typeUser.toLowerCase()) {
      case 'audio':
        type = 'audio';
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac';   
        caption = 'Toma tu audio';         
        break;

      case 'video' :
        type = 'video';
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4';   
        caption = '¡Esto es una video!';  
        break  

      case 'image' :
        type = 'image';
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png';   
        caption = '¡Esto es una imagen!';  
        break  

      case 'document' :
        type = 'document';
        mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf';   
        caption = '¡Esto es una PDF!';  
        break  
    
      default:
        await sendMessage(to,'No reconozco el tipo de archivo solicitado' );
        return;
    }
    
// const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac';   
// const caption = 'Bienvenida';   
// const type = 'audio';

// const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png';   
// const caption = '¡Esto es una Imagen!';   
// const type = 'image';

// const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4';   
// const caption = '¡Esto es una video!';   
// const type = 'video';

    // const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf';   
    // const caption = '¡Esto es un PDF!';   
    // const type = 'document';


    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  } //COMO SE LO VAMOS A ENVIAR

  //HAREMOA NUESTRA LOGICA DE ALPOIMENT FLOW CON VARIAS PREGUTNAS RELACIONADAS DE LA CONSULTA
  async handleAppointmentFlow(to, message){
    //trabajar con el estado ya teneiendo la clase y constructor
    const state = this.appointmentState(to);
    let response;

    switch (state.step) {
      case 'name':
        state.name = message;
        state.step = 'petName';
        response = "Gracias ahora, ¿Cuál es el nombre de tu mascota?"
        break;
    
      case 'petName':
        state.petName = message;
        state.step = 'PetType';
        response = '¿Qué tipo de mascota es?'  
        break;

      case 'petType':
        state.petType = message;
        state.step = 'reason';
        response = '¿Cuál es el motivo de la consulta?'
        break

      case 'reason':
        state.reason = meesage;
        response = 'Gracias por agendar tu cita'
 
    }
          //cuando envia el mensaje del ingresa tu nombre
      await whatsappService.sendMessage(to,response);

  }
}

export default new MessageHandler();