# Usa la imagen de Node.js versión 20
FROM node:20.14.0

# Establece el directorio de trabajo
WORKDIR /usr/src/app

# Copia el package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación
COPY . .

# Exponer el puerto en el que tu app escucha
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["npm", "start"]
