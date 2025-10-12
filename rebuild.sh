#!/bin/bash

# Запустить сборку фронтенда
npm run build

# Удалить папку dist в /var/www/
sudo rm -rf /var/www/dist

# переименовать /build в /dist
mv /opt/Affiliate_Program/AffiliateProgramFrontend_v2/build /opt/Affiliate_Program/AffiliateProgramFrontend_v2/dist

# Переместить папку dist из директории проекта фронтенда в /var/www/
sudo mv /opt/Affiliate_Program/AffiliateProgramFrontend_v2/dist /var/www/

# Перезапустить сервис Nginx
sudo service nginx restart