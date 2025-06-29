#!/bin/bash

# Agent Workflow Frontend Cleanup
# Remove arquivos boilerplate desnecessários do Vite

echo "🧹 Iniciando limpeza do frontend..."

cd "$(dirname "$0")"

# Components boilerplate
echo "❌ Removendo components boilerplate..."
rm -f src/components/HelloWorld.vue
rm -f src/components/TheWelcome.vue
rm -f src/components/WelcomeItem.vue

# Views desnecessárias
echo "❌ Removendo views boilerplate..."
rm -f src/views/HomeView.vue
rm -f src/views/AboutView.vue

# Stores não utilizados
echo "❌ Removendo stores não utilizados..."
rm -f src/stores/counter.js
rm -f src/stores/tasks.js

# DS_Store files (macOS)
echo "❌ Removendo arquivos .DS_Store..."
find . -name ".DS_Store" -delete

echo "✅ Limpeza concluída!"
