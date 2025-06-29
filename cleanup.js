#!/usr/bin/env node

// Script temporário para limpar arquivos antigos
import { unlink } from 'fs/promises'

async function cleanup() {
  try {
    await unlink('./templates/agent/current_tasks.json')
    console.log('Arquivo antigo removido')
  } catch (error) {
    console.log('Arquivo já foi removido ou não existe')
  }
}

cleanup()
