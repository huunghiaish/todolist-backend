# Sử dụng node image chính thức làm base image
FROM node:18-alpine

# Định nghĩa các ARG để có thể truyền vào khi build
ARG MONGODB_URI
ARG REDIS_URL

# Thiết lập các biến môi trường từ ARG
ENV MONGODB_URI=${MONGODB_URI}
ENV REDIS_URL=${REDIS_URL}

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy package.json và package-lock.json
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Build ứng dụng
RUN npm run build

# Expose port mà ứng dụng sẽ chạy
EXPOSE 80

# Command để chạy ứng dụng
CMD ["npm", "start"]