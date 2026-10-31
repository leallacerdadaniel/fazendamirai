export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      animais: {
        Row: {
          apelido: string | null
          aspiracoes_fiv: number | null
          associacao: string | null
          associacao_consultado_em: string | null
          avaliacao: string | null
          betacaseina: string | null
          betacaseina_laudo: string | null
          botton: string | null
          brinco: string | null
          categoria_registro: string | null
          causa_morte: string | null
          cdc: string | null
          cdn: string | null
          cgn: string | null
          codigo_importacao: string | null
          composicao_racial: string | null
          comprador: string | null
          concepcao_data: string | null
          concepcao_tipo: string | null
          created_at: string
          criador: string | null
          dados_originais: Json | null
          data_compra: string | null
          data_morte: string | null
          data_venda: string | null
          dna: string | null
          endogamia_pct: number | null
          entrada_evento: string | null
          entrada_tipo: string | null
          foto_url: string | null
          gpta: number | null
          grau_sangue: string | null
          gta_numero: string | null
          id: string
          indice_genetico: number | null
          indice_tipo: string | null
          lactacao_kg: number | null
          lactacao_vitalicia_dias: number | null
          lactacao_vitalicia_kg: number | null
          livro_registro: string | null
          localizacao: string
          lote_id: string | null
          mae_id: string | null
          mae_nome: string | null
          mae_rgd: string | null
          marcador_socio: string | null
          motivo_saida: string | null
          municipio_uf: string | null
          nascimento: string | null
          nome: string | null
          observacoes: string | null
          origem: string | null
          pai_id: string | null
          pai_nome: string | null
          pai_rgd: string | null
          parceiro_nome: string | null
          percentual_propriedade: number | null
          peso_compra: number | null
          peso_nascimento_kg: number | null
          peso_venda: number | null
          possui_rgd: boolean | null
          previsao_parto: string | null
          propriedade: string | null
          proprietario: string | null
          pta: number | null
          raca: string | null
          raca_sangue: string | null
          receptora_gestacao: string | null
          receptora_usada: string | null
          registro_racial: string | null
          rgd: string | null
          rgd_data_inspecao: string | null
          rgd_inspetor: string | null
          rgn_data_inspecao: string | null
          rgn_inspetor: string | null
          rgn_registro: string | null
          saida_evento: string | null
          saida_tipo: string | null
          sexo: string | null
          status: string
          status_associacao: string | null
          status_registro: string | null
          tetos: number
          tipo: string | null
          ultima_identificacao: string | null
          ultimo_parto: string | null
          updated_at: string
          valor_compra: number | null
          valor_venda: number | null
          vg: number | null
        }
        Insert: {
          apelido?: string | null
          aspiracoes_fiv?: number | null
          associacao?: string | null
          associacao_consultado_em?: string | null
          avaliacao?: string | null
          betacaseina?: string | null
          betacaseina_laudo?: string | null
          botton?: string | null
          brinco?: string | null
          categoria_registro?: string | null
          causa_morte?: string | null
          cdc?: string | null
          cdn?: string | null
          cgn?: string | null
          codigo_importacao?: string | null
          composicao_racial?: string | null
          comprador?: string | null
          concepcao_data?: string | null
          concepcao_tipo?: string | null
          created_at?: string
          criador?: string | null
          dados_originais?: Json | null
          data_compra?: string | null
          data_morte?: string | null
          data_venda?: string | null
          dna?: string | null
          endogamia_pct?: number | null
          entrada_evento?: string | null
          entrada_tipo?: string | null
          foto_url?: string | null
          gpta?: number | null
          grau_sangue?: string | null
          gta_numero?: string | null
          id?: string
          indice_genetico?: number | null
          indice_tipo?: string | null
          lactacao_kg?: number | null
          lactacao_vitalicia_dias?: number | null
          lactacao_vitalicia_kg?: number | null
          livro_registro?: string | null
          localizacao?: string
          lote_id?: string | null
          mae_id?: string | null
          mae_nome?: string | null
          mae_rgd?: string | null
          marcador_socio?: string | null
          motivo_saida?: string | null
          municipio_uf?: string | null
          nascimento?: string | null
          nome?: string | null
          observacoes?: string | null
          origem?: string | null
          pai_id?: string | null
          pai_nome?: string | null
          pai_rgd?: string | null
          parceiro_nome?: string | null
          percentual_propriedade?: number | null
          peso_compra?: number | null
          peso_nascimento_kg?: number | null
          peso_venda?: number | null
          possui_rgd?: boolean | null
          previsao_parto?: string | null
          propriedade?: string | null
          proprietario?: string | null
          pta?: number | null
          raca?: string | null
          raca_sangue?: string | null
          receptora_gestacao?: string | null
          receptora_usada?: string | null
          registro_racial?: string | null
          rgd?: string | null
          rgd_data_inspecao?: string | null
          rgd_inspetor?: string | null
          rgn_data_inspecao?: string | null
          rgn_inspetor?: string | null
          rgn_registro?: string | null
          saida_evento?: string | null
          saida_tipo?: string | null
          sexo?: string | null
          status?: string
          status_associacao?: string | null
          status_registro?: string | null
          tetos?: number
          tipo?: string | null
          ultima_identificacao?: string | null
          ultimo_parto?: string | null
          updated_at?: string
          valor_compra?: number | null
          valor_venda?: number | null
          vg?: number | null
        }
        Update: {
          apelido?: string | null
          aspiracoes_fiv?: number | null
          associacao?: string | null
          associacao_consultado_em?: string | null
          avaliacao?: string | null
          betacaseina?: string | null
          betacaseina_laudo?: string | null
          botton?: string | null
          brinco?: string | null
          categoria_registro?: string | null
          causa_morte?: string | null
          cdc?: string | null
          cdn?: string | null
          cgn?: string | null
          codigo_importacao?: string | null
          composicao_racial?: string | null
          comprador?: string | null
          concepcao_data?: string | null
          concepcao_tipo?: string | null
          created_at?: string
          criador?: string | null
          dados_originais?: Json | null
          data_compra?: string | null
          data_morte?: string | null
          data_venda?: string | null
          dna?: string | null
          endogamia_pct?: number | null
          entrada_evento?: string | null
          entrada_tipo?: string | null
          foto_url?: string | null
          gpta?: number | null
          grau_sangue?: string | null
          gta_numero?: string | null
          id?: string
          indice_genetico?: number | null
          indice_tipo?: string | null
          lactacao_kg?: number | null
          lactacao_vitalicia_dias?: number | null
          lactacao_vitalicia_kg?: number | null
          livro_registro?: string | null
          localizacao?: string
          lote_id?: string | null
          mae_id?: string | null
          mae_nome?: string | null
          mae_rgd?: string | null
          marcador_socio?: string | null
          motivo_saida?: string | null
          municipio_uf?: string | null
          nascimento?: string | null
          nome?: string | null
          observacoes?: string | null
          origem?: string | null
          pai_id?: string | null
          pai_nome?: string | null
          pai_rgd?: string | null
          parceiro_nome?: string | null
          percentual_propriedade?: number | null
          peso_compra?: number | null
          peso_nascimento_kg?: number | null
          peso_venda?: number | null
          possui_rgd?: boolean | null
          previsao_parto?: string | null
          propriedade?: string | null
          proprietario?: string | null
          pta?: number | null
          raca?: string | null
          raca_sangue?: string | null
          receptora_gestacao?: string | null
          receptora_usada?: string | null
          registro_racial?: string | null
          rgd?: string | null
          rgd_data_inspecao?: string | null
          rgd_inspetor?: string | null
          rgn_data_inspecao?: string | null
          rgn_inspetor?: string | null
          rgn_registro?: string | null
          saida_evento?: string | null
          saida_tipo?: string | null
          sexo?: string | null
          status?: string
          status_associacao?: string | null
          status_registro?: string | null
          tetos?: number
          tipo?: string | null
          ultima_identificacao?: string | null
          ultimo_parto?: string | null
          updated_at?: string
          valor_compra?: number | null
          valor_venda?: number | null
          vg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "animais_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animais_mae_id_fkey"
            columns: ["mae_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "animais_pai_id_fkey"
            columns: ["pai_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      animais_externos: {
        Row: {
          animal_id: string | null
          categoria: string | null
          composicao_racial: string | null
          created_at: string
          fonte: string | null
          id: string
          mae_registro: string | null
          nascimento: string | null
          nome: string | null
          pai_registro: string | null
          raca: string | null
          registro: string
          sexo: string | null
          updated_at: string
        }
        Insert: {
          animal_id?: string | null
          categoria?: string | null
          composicao_racial?: string | null
          created_at?: string
          fonte?: string | null
          id?: string
          mae_registro?: string | null
          nascimento?: string | null
          nome?: string | null
          pai_registro?: string | null
          raca?: string | null
          registro: string
          sexo?: string | null
          updated_at?: string
        }
        Update: {
          animal_id?: string | null
          categoria?: string | null
          composicao_racial?: string | null
          created_at?: string
          fonte?: string | null
          id?: string
          mae_registro?: string | null
          nascimento?: string | null
          nome?: string | null
          pai_registro?: string | null
          raca?: string | null
          registro?: string
          sexo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "animais_externos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      aplicacoes_hormonais: {
        Row: {
          animal_id: string
          created_at: string
          data_aplicacao: string
          id: string
          observacao: string | null
          registrado_por: string | null
          tipo: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          data_aplicacao: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          tipo: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          data_aplicacao?: string
          id?: string
          observacao?: string | null
          registrado_por?: string | null
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "aplicacoes_hormonais_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      avaliacoes_geneticas: {
        Row: {
          acuracia_pct: number | null
          animal_id: string
          ano: number | null
          caracteristica: string
          created_at: string
          data_avaliacao: string | null
          extra: Json | null
          fonte: string | null
          grupo: string | null
          id: string
          sigla: string | null
          unidade: string | null
          valor: number | null
        }
        Insert: {
          acuracia_pct?: number | null
          animal_id: string
          ano?: number | null
          caracteristica: string
          created_at?: string
          data_avaliacao?: string | null
          extra?: Json | null
          fonte?: string | null
          grupo?: string | null
          id?: string
          sigla?: string | null
          unidade?: string | null
          valor?: number | null
        }
        Update: {
          acuracia_pct?: number | null
          animal_id?: string
          ano?: number | null
          caracteristica?: string
          created_at?: string
          data_avaliacao?: string | null
          extra?: Json | null
          fonte?: string | null
          grupo?: string | null
          id?: string
          sigla?: string | null
          unidade?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_geneticas_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      banco_nomes: {
        Row: {
          created_at: string
          id: string
          nome: string
          usado: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          usado?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          usado?: boolean
        }
        Relationships: []
      }
      campanhas_vacinacao: {
        Row: {
          created_at: string
          data: string | null
          id: string
          nome: string
          observacao: string | null
          responsavel: string | null
          updated_at: string
          vacina_id: string | null
        }
        Insert: {
          created_at?: string
          data?: string | null
          id?: string
          nome: string
          observacao?: string | null
          responsavel?: string | null
          updated_at?: string
          vacina_id?: string | null
        }
        Update: {
          created_at?: string
          data?: string | null
          id?: string
          nome?: string
          observacao?: string | null
          responsavel?: string | null
          updated_at?: string
          vacina_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campanhas_vacinacao_vacina_id_fkey"
            columns: ["vacina_id"]
            isOneToOne: false
            referencedRelation: "vacinas"
            referencedColumns: ["id"]
          },
        ]
      }
      complicacoes_parto: {
        Row: {
          animal_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          id: string
          observacao: string | null
          parto_id: string
          tipo: string
          tratamento: string | null
          updated_at: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          id?: string
          observacao?: string | null
          parto_id: string
          tipo: string
          tratamento?: string | null
          updated_at?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          id?: string
          observacao?: string | null
          parto_id?: string
          tipo?: string
          tratamento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "complicacoes_parto_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "complicacoes_parto_parto_id_fkey"
            columns: ["parto_id"]
            isOneToOne: false
            referencedRelation: "partos"
            referencedColumns: ["id"]
          },
        ]
      }
      consultas_associacao: {
        Row: {
          animal_id: string | null
          consultado_em: string
          fonte: string
          id: string
          payload: Json | null
          registro: string | null
          status: string
        }
        Insert: {
          animal_id?: string | null
          consultado_em?: string
          fonte: string
          id?: string
          payload?: Json | null
          registro?: string | null
          status?: string
        }
        Update: {
          animal_id?: string | null
          consultado_em?: string
          fonte?: string
          id?: string
          payload?: Json | null
          registro?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultas_associacao_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      consumo_silo: {
        Row: {
          created_at: string
          data: string
          id: string
          lote_id: string | null
          quantidade_ton: number
          silo_id: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          lote_id?: string | null
          quantidade_ton: number
          silo_id: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          lote_id?: string | null
          quantidade_ton?: number
          silo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consumo_silo_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consumo_silo_silo_id_fkey"
            columns: ["silo_id"]
            isOneToOne: false
            referencedRelation: "silos"
            referencedColumns: ["id"]
          },
        ]
      }
      controle_leiteiro: {
        Row: {
          animal_id: string
          ccs: number | null
          created_at: string
          data_coleta: string
          esd: number | null
          gordura_pct: number | null
          id: string
          lactose_pct: number | null
          proteina_pct: number | null
          st: number | null
        }
        Insert: {
          animal_id: string
          ccs?: number | null
          created_at?: string
          data_coleta: string
          esd?: number | null
          gordura_pct?: number | null
          id?: string
          lactose_pct?: number | null
          proteina_pct?: number | null
          st?: number | null
        }
        Update: {
          animal_id?: string
          ccs?: number | null
          created_at?: string
          data_coleta?: string
          esd?: number | null
          gordura_pct?: number | null
          id?: string
          lactose_pct?: number | null
          proteina_pct?: number | null
          st?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "controle_leiteiro_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      diagnosticos_gestacao: {
        Row: {
          animal_id: string
          created_at: string
          data: string
          dias_gestacao: number | null
          id: string
          metodo: string | null
          previsao_parto: string | null
          resultado: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          data: string
          dias_gestacao?: number | null
          id?: string
          metodo?: string | null
          previsao_parto?: string | null
          resultado?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          data?: string
          dias_gestacao?: number | null
          id?: string
          metodo?: string | null
          previsao_parto?: string | null
          resultado?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "diagnosticos_gestacao_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      dietas_lote: {
        Row: {
          created_at: string
          custo_kg: number | null
          id: string
          ingrediente: string
          lote_id: string
          observacao: string | null
          quantidade_kg: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo_kg?: number | null
          id?: string
          ingrediente: string
          lote_id: string
          observacao?: string | null
          quantidade_kg?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo_kg?: number | null
          id?: string
          ingrediente?: string
          lote_id?: string
          observacao?: string | null
          quantidade_kg?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dietas_lote_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      equipamentos: {
        Row: {
          ano: number | null
          created_at: string
          custo: number | null
          data_compra: string | null
          id: string
          marca: string | null
          modelo: string | null
          nome: string
          numero_serie: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          ano?: number | null
          created_at?: string
          custo?: number | null
          data_compra?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome: string
          numero_serie?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          ano?: number | null
          created_at?: string
          custo?: number | null
          data_compra?: string | null
          id?: string
          marca?: string | null
          modelo?: string | null
          nome?: string
          numero_serie?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      estoque_embrioes: {
        Row: {
          created_at: string
          custo: number | null
          doadora_nome: string | null
          grau: string | null
          id: string
          palheta: string | null
          sexagem: string | null
          tanque: string | null
          touro_nome: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo?: number | null
          doadora_nome?: string | null
          grau?: string | null
          id?: string
          palheta?: string | null
          sexagem?: string | null
          tanque?: string | null
          touro_nome?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo?: number | null
          doadora_nome?: string | null
          grau?: string | null
          id?: string
          palheta?: string | null
          sexagem?: string | null
          tanque?: string | null
          touro_nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      estoque_itens: {
        Row: {
          categoria: string | null
          created_at: string
          custo: number | null
          id: string
          localizacao: string | null
          nome: string
          quantidade: number | null
          quantidade_minima: number | null
          unidade: string | null
          updated_at: string
          validade: string | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          custo?: number | null
          id?: string
          localizacao?: string | null
          nome: string
          quantidade?: number | null
          quantidade_minima?: number | null
          unidade?: string | null
          updated_at?: string
          validade?: string | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          custo?: number | null
          id?: string
          localizacao?: string | null
          nome?: string
          quantidade?: number | null
          quantidade_minima?: number | null
          unidade?: string | null
          updated_at?: string
          validade?: string | null
        }
        Relationships: []
      }
      estoque_semen: {
        Row: {
          betacaseina: string | null
          created_at: string
          custo: number | null
          data_contagem: string | null
          doses: number | null
          doses_convencional: number | null
          doses_sexado: number | null
          gpta: number | null
          id: string
          local: string | null
          observacao: string | null
          partida: string | null
          raca: string | null
          rgd: string | null
          touro_nome: string
          updated_at: string
          vg: number | null
        }
        Insert: {
          betacaseina?: string | null
          created_at?: string
          custo?: number | null
          data_contagem?: string | null
          doses?: number | null
          doses_convencional?: number | null
          doses_sexado?: number | null
          gpta?: number | null
          id?: string
          local?: string | null
          observacao?: string | null
          partida?: string | null
          raca?: string | null
          rgd?: string | null
          touro_nome: string
          updated_at?: string
          vg?: number | null
        }
        Update: {
          betacaseina?: string | null
          created_at?: string
          custo?: number | null
          data_contagem?: string | null
          doses?: number | null
          doses_convencional?: number | null
          doses_sexado?: number | null
          gpta?: number | null
          id?: string
          local?: string | null
          observacao?: string | null
          partida?: string | null
          raca?: string | null
          rgd?: string | null
          touro_nome?: string
          updated_at?: string
          vg?: number | null
        }
        Relationships: []
      }
      fechamento_itens: {
        Row: {
          created_at: string
          descritivo: string
          dias: number | null
          fechamento_id: string
          id: string
          ordem: number
          qtd_animal: number | null
          qtd_kg: number | null
          tipo: string
          total_manual: number | null
          valor_unit: number | null
        }
        Insert: {
          created_at?: string
          descritivo: string
          dias?: number | null
          fechamento_id: string
          id?: string
          ordem?: number
          qtd_animal?: number | null
          qtd_kg?: number | null
          tipo?: string
          total_manual?: number | null
          valor_unit?: number | null
        }
        Update: {
          created_at?: string
          descritivo?: string
          dias?: number | null
          fechamento_id?: string
          id?: string
          ordem?: number
          qtd_animal?: number | null
          qtd_kg?: number | null
          tipo?: string
          total_manual?: number | null
          valor_unit?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fechamento_itens_fechamento_id_fkey"
            columns: ["fechamento_id"]
            isOneToOne: false
            referencedRelation: "fechamentos_socios"
            referencedColumns: ["id"]
          },
        ]
      }
      fechamentos_socios: {
        Row: {
          ano: number
          created_at: string
          data_pagamento: string | null
          grupo_id: string
          id: string
          mes: number
          pago: boolean
        }
        Insert: {
          ano: number
          created_at?: string
          data_pagamento?: string | null
          grupo_id: string
          id?: string
          mes: number
          pago?: boolean
        }
        Update: {
          ano?: number
          created_at?: string
          data_pagamento?: string | null
          grupo_id?: string
          id?: string
          mes?: number
          pago?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "fechamentos_socios_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_socios"
            referencedColumns: ["id"]
          },
        ]
      }
      grupo_animais: {
        Row: {
          animal_id: string
          created_at: string
          grupo_id: string
          id: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          grupo_id: string
          id?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          grupo_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grupo_animais_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grupo_animais_grupo_id_fkey"
            columns: ["grupo_id"]
            isOneToOne: false
            referencedRelation: "grupos_socios"
            referencedColumns: ["id"]
          },
        ]
      }
      grupos_socios: {
        Row: {
          created_at: string
          divisor: number
          id: string
          nome: string
          observacao: string | null
        }
        Insert: {
          created_at?: string
          divisor?: number
          id?: string
          nome: string
          observacao?: string | null
        }
        Update: {
          created_at?: string
          divisor?: number
          id?: string
          nome?: string
          observacao?: string | null
        }
        Relationships: []
      }
      importacao_pendencias: {
        Row: {
          animal_id: string | null
          created_at: string
          dados: Json | null
          id: string
          motivo: string
          origem: string
          resolvida: boolean
        }
        Insert: {
          animal_id?: string | null
          created_at?: string
          dados?: Json | null
          id?: string
          motivo: string
          origem: string
          resolvida?: boolean
        }
        Update: {
          animal_id?: string | null
          created_at?: string
          dados?: Json | null
          id?: string
          motivo?: string
          origem?: string
          resolvida?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "importacao_pendencias_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      lactacoes_controladas: {
        Row: {
          animal_id: string
          created_at: string
          data_encerramento: string | null
          data_parto: string | null
          dias_lactacao: number | null
          fonte: string | null
          id: string
          idade_parto: string | null
          intervalo_partos: number | null
          media_diaria_kg: number | null
          numero_ordenhas: number | null
          ordem: number | null
          producao_kg: number | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          data_encerramento?: string | null
          data_parto?: string | null
          dias_lactacao?: number | null
          fonte?: string | null
          id?: string
          idade_parto?: string | null
          intervalo_partos?: number | null
          media_diaria_kg?: number | null
          numero_ordenhas?: number | null
          ordem?: number | null
          producao_kg?: number | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          data_encerramento?: string | null
          data_parto?: string | null
          dias_lactacao?: number | null
          fonte?: string | null
          id?: string
          idade_parto?: string | null
          intervalo_partos?: number | null
          media_diaria_kg?: number | null
          numero_ordenhas?: number | null
          ordem?: number | null
          producao_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lactacoes_controladas_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos: {
        Row: {
          centro_custo: string | null
          competencia: string | null
          created_at: string
          data_lancamento: string
          descricao: string
          id: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          centro_custo?: string | null
          competencia?: string | null
          created_at?: string
          data_lancamento: string
          descricao: string
          id?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          centro_custo?: string | null
          competencia?: string | null
          created_at?: string
          data_lancamento?: string
          descricao?: string
          id?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: []
      }
      lotes: {
        Row: {
          capacidade: number | null
          categoria: string | null
          coordenadas: Json | null
          cor: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          nome: string
          piquete: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          capacidade?: number | null
          categoria?: string | null
          coordenadas?: Json | null
          cor?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome: string
          piquete?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          capacidade?: number | null
          categoria?: string | null
          coordenadas?: Json | null
          cor?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          nome?: string
          piquete?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      manutencoes: {
        Row: {
          created_at: string
          custo: number | null
          data: string
          descricao: string | null
          equipamento_id: string
          id: string
          proxima_manutencao: string | null
          responsavel: string | null
          tipo: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          custo?: number | null
          data: string
          descricao?: string | null
          equipamento_id: string
          id?: string
          proxima_manutencao?: string | null
          responsavel?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          custo?: number | null
          data?: string
          descricao?: string | null
          equipamento_id?: string
          id?: string
          proxima_manutencao?: string | null
          responsavel?: string | null
          tipo?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "manutencoes_equipamento_id_fkey"
            columns: ["equipamento_id"]
            isOneToOne: false
            referencedRelation: "equipamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      mastites: {
        Row: {
          animal_id: string
          created_at: string
          data_inicio: string
          descarte_dias: number | null
          id: string
          quarto: string | null
          resultado_cmt: string | null
          tratamento: string | null
          updated_at: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          data_inicio: string
          descarte_dias?: number | null
          id?: string
          quarto?: string | null
          resultado_cmt?: string | null
          tratamento?: string | null
          updated_at?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          data_inicio?: string
          descarte_dias?: number | null
          id?: string
          quarto?: string | null
          resultado_cmt?: string | null
          tratamento?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mastites_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      medicamentos: {
        Row: {
          carencia_dias: number | null
          created_at: string
          custo: number | null
          id: string
          lote: string | null
          nome: string
          principio_ativo: string | null
          quantidade: number | null
          updated_at: string
          validade: string | null
        }
        Insert: {
          carencia_dias?: number | null
          created_at?: string
          custo?: number | null
          id?: string
          lote?: string | null
          nome: string
          principio_ativo?: string | null
          quantidade?: number | null
          updated_at?: string
          validade?: string | null
        }
        Update: {
          carencia_dias?: number | null
          created_at?: string
          custo?: number | null
          id?: string
          lote?: string | null
          nome?: string
          principio_ativo?: string | null
          quantidade?: number | null
          updated_at?: string
          validade?: string | null
        }
        Relationships: []
      }
      movimentacoes_estoque: {
        Row: {
          created_at: string
          data: string
          id: string
          item_id: string
          motivo: string | null
          quantidade: number
          tipo: string
        }
        Insert: {
          created_at?: string
          data: string
          id?: string
          item_id: string
          motivo?: string | null
          quantidade: number
          tipo: string
        }
        Update: {
          created_at?: string
          data?: string
          id?: string
          item_id?: string
          motivo?: string | null
          quantidade?: number
          tipo?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_estoque_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "estoque_itens"
            referencedColumns: ["id"]
          },
        ]
      }
      nota_cooperativa: {
        Row: {
          adiantamento: number | null
          adicional_mercado: number | null
          ano: number
          bonif_fidelidade: number | null
          bonif_geral: number | null
          bonif_qualidade: number | null
          bonif_temperatura: number | null
          cbt: number | null
          ccs: number | null
          comprabst: number | null
          created_at: string
          frete: number | null
          id: string
          inss_rat_senar: number | null
          materia_gorda: number | null
          mes: number
          outros_desc: string | null
          outros_valor: number | null
          pct_aproveitamento: number | null
          proteina_pct: number | null
          quantidade_litros: number | null
          updated_at: string
          valor_bruto: number | null
          valor_liquido: number | null
          valor_unitario: number | null
        }
        Insert: {
          adiantamento?: number | null
          adicional_mercado?: number | null
          ano: number
          bonif_fidelidade?: number | null
          bonif_geral?: number | null
          bonif_qualidade?: number | null
          bonif_temperatura?: number | null
          cbt?: number | null
          ccs?: number | null
          comprabst?: number | null
          created_at?: string
          frete?: number | null
          id?: string
          inss_rat_senar?: number | null
          materia_gorda?: number | null
          mes: number
          outros_desc?: string | null
          outros_valor?: number | null
          pct_aproveitamento?: number | null
          proteina_pct?: number | null
          quantidade_litros?: number | null
          updated_at?: string
          valor_bruto?: number | null
          valor_liquido?: number | null
          valor_unitario?: number | null
        }
        Update: {
          adiantamento?: number | null
          adicional_mercado?: number | null
          ano?: number
          bonif_fidelidade?: number | null
          bonif_geral?: number | null
          bonif_qualidade?: number | null
          bonif_temperatura?: number | null
          cbt?: number | null
          ccs?: number | null
          comprabst?: number | null
          created_at?: string
          frete?: number | null
          id?: string
          inss_rat_senar?: number | null
          materia_gorda?: number | null
          mes?: number
          outros_desc?: string | null
          outros_valor?: number | null
          pct_aproveitamento?: number | null
          proteina_pct?: number | null
          quantidade_litros?: number | null
          updated_at?: string
          valor_bruto?: number | null
          valor_liquido?: number | null
          valor_unitario?: number | null
        }
        Relationships: []
      }
      parcerias: {
        Row: {
          animal_id: string
          created_at: string
          id: string
          parceiro_nome: string
          percentual: number
          updated_at: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          id?: string
          parceiro_nome: string
          percentual?: number
          updated_at?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          id?: string
          parceiro_nome?: string
          percentual?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "parcerias_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      partos: {
        Row: {
          bezerro_id: string | null
          colostro: boolean | null
          created_at: string
          data: string
          facilidade: string | null
          id: string
          observacao: string | null
          peso_bezerro_kg: number | null
          vaca_id: string
        }
        Insert: {
          bezerro_id?: string | null
          colostro?: boolean | null
          created_at?: string
          data: string
          facilidade?: string | null
          id?: string
          observacao?: string | null
          peso_bezerro_kg?: number | null
          vaca_id: string
        }
        Update: {
          bezerro_id?: string | null
          colostro?: boolean | null
          created_at?: string
          data?: string
          facilidade?: string | null
          id?: string
          observacao?: string | null
          peso_bezerro_kg?: number | null
          vaca_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partos_bezerro_id_fkey"
            columns: ["bezerro_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partos_vaca_id_fkey"
            columns: ["vaca_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      pesagens: {
        Row: {
          animal_id: string
          created_at: string
          data: string
          id: string
          ocasiao: string | null
          peso_kg: number
          registrado_por: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          data: string
          id?: string
          ocasiao?: string | null
          peso_kg: number
          registrado_por?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          data?: string
          id?: string
          ocasiao?: string | null
          peso_kg?: number
          registrado_por?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pesagens_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      plantio_custos: {
        Row: {
          categoria: string
          created_at: string
          descricao: string | null
          dpp: number | null
          especificacao: string
          etapa: string
          id: string
          ordem: number
          plantio_id: string
          quantidade: number | null
          realizado: number | null
          unidade: string | null
          valor_unitario: number | null
        }
        Insert: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          dpp?: number | null
          especificacao: string
          etapa: string
          id?: string
          ordem?: number
          plantio_id: string
          quantidade?: number | null
          realizado?: number | null
          unidade?: string | null
          valor_unitario?: number | null
        }
        Update: {
          categoria?: string
          created_at?: string
          descricao?: string | null
          dpp?: number | null
          especificacao?: string
          etapa?: string
          id?: string
          ordem?: number
          plantio_id?: string
          quantidade?: number | null
          realizado?: number | null
          unidade?: string | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plantio_custos_plantio_id_fkey"
            columns: ["plantio_id"]
            isOneToOne: false
            referencedRelation: "plantios"
            referencedColumns: ["id"]
          },
        ]
      }
      plantios: {
        Row: {
          area_ha: number | null
          area_tipo: string | null
          created_at: string
          cultura: string
          custo_semente: number | null
          data: string | null
          fase: string | null
          fertilizante: string | null
          id: string
          materia_seca_pct: number | null
          nome: string | null
          perda_pct: number | null
          posicao_data: string | null
          preco_mercado_ton: number | null
          produtividade_esperada_ton_ha: number | null
          responsavel_tecnico: string | null
          safra: string | null
          sistema: string | null
          updated_at: string
          variedade: string | null
        }
        Insert: {
          area_ha?: number | null
          area_tipo?: string | null
          created_at?: string
          cultura: string
          custo_semente?: number | null
          data?: string | null
          fase?: string | null
          fertilizante?: string | null
          id?: string
          materia_seca_pct?: number | null
          nome?: string | null
          perda_pct?: number | null
          posicao_data?: string | null
          preco_mercado_ton?: number | null
          produtividade_esperada_ton_ha?: number | null
          responsavel_tecnico?: string | null
          safra?: string | null
          sistema?: string | null
          updated_at?: string
          variedade?: string | null
        }
        Update: {
          area_ha?: number | null
          area_tipo?: string | null
          created_at?: string
          cultura?: string
          custo_semente?: number | null
          data?: string | null
          fase?: string | null
          fertilizante?: string | null
          id?: string
          materia_seca_pct?: number | null
          nome?: string | null
          perda_pct?: number | null
          posicao_data?: string | null
          preco_mercado_ton?: number | null
          produtividade_esperada_ton_ha?: number | null
          responsavel_tecnico?: string | null
          safra?: string | null
          sistema?: string | null
          updated_at?: string
          variedade?: string | null
        }
        Relationships: []
      }
      producao_leite_diaria: {
        Row: {
          animal_id: string | null
          com_mastite: boolean
          created_at: string
          data: string
          id: string
          litros: number
          lote_id: string | null
          registrado_por: string | null
          turno: string | null
          usa_ocitocina: boolean
        }
        Insert: {
          animal_id?: string | null
          com_mastite?: boolean
          created_at?: string
          data: string
          id?: string
          litros: number
          lote_id?: string | null
          registrado_por?: string | null
          turno?: string | null
          usa_ocitocina?: boolean
        }
        Update: {
          animal_id?: string | null
          com_mastite?: boolean
          created_at?: string
          data?: string
          id?: string
          litros?: number
          lote_id?: string | null
          registrado_por?: string | null
          turno?: string | null
          usa_ocitocina?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "producao_leite_diaria_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "producao_leite_diaria_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ativo: boolean
          created_at: string
          email: string | null
          id: string
          nome: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id: string
          nome?: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          email?: string | null
          id?: string
          nome?: string
          updated_at?: string
        }
        Relationships: []
      }
      protocolo_animais: {
        Row: {
          animal_id: string
          created_at: string
          doadora: string | null
          id: string
          observacao: string | null
          protocolo_id: string
          resultado: string | null
          semen_sexado: string | null
          touro_nome: string | null
          touro_rgd: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          doadora?: string | null
          id?: string
          observacao?: string | null
          protocolo_id: string
          resultado?: string | null
          semen_sexado?: string | null
          touro_nome?: string | null
          touro_rgd?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          doadora?: string | null
          id?: string
          observacao?: string | null
          protocolo_id?: string
          resultado?: string | null
          semen_sexado?: string | null
          touro_nome?: string | null
          touro_rgd?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "protocolo_animais_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "protocolo_animais_protocolo_id_fkey"
            columns: ["protocolo_id"]
            isOneToOne: false
            referencedRelation: "protocolos_iatf"
            referencedColumns: ["id"]
          },
        ]
      }
      protocolos_iatf: {
        Row: {
          codigo_importacao: string | null
          created_at: string
          data_inicio: string | null
          id: string
          local: string | null
          lote_numero: string | null
          nome: string
          observacao: string | null
          tipo: string | null
          touro_nome: string | null
          touro_rgd: string | null
          updated_at: string
        }
        Insert: {
          codigo_importacao?: string | null
          created_at?: string
          data_inicio?: string | null
          id?: string
          local?: string | null
          lote_numero?: string | null
          nome: string
          observacao?: string | null
          tipo?: string | null
          touro_nome?: string | null
          touro_rgd?: string | null
          updated_at?: string
        }
        Update: {
          codigo_importacao?: string | null
          created_at?: string
          data_inicio?: string | null
          id?: string
          local?: string | null
          lote_numero?: string | null
          nome?: string
          observacao?: string | null
          tipo?: string | null
          touro_nome?: string | null
          touro_rgd?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reproducoes: {
        Row: {
          animal_id: string
          created_at: string
          data: string
          doadora: string | null
          embriao_info: string | null
          id: string
          metodo: string
          observacao: string | null
          protocolo: string | null
          receptora_id: string | null
          resultado: string | null
          sangue_previsto: string | null
          semen_partida: string | null
          semen_sexado: string | null
          sexo_feto: string | null
          tecnico: string | null
          touro_nome: string | null
          touro_rgd: string | null
          updated_at: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          data: string
          doadora?: string | null
          embriao_info?: string | null
          id?: string
          metodo: string
          observacao?: string | null
          protocolo?: string | null
          receptora_id?: string | null
          resultado?: string | null
          sangue_previsto?: string | null
          semen_partida?: string | null
          semen_sexado?: string | null
          sexo_feto?: string | null
          tecnico?: string | null
          touro_nome?: string | null
          touro_rgd?: string | null
          updated_at?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          data?: string
          doadora?: string | null
          embriao_info?: string | null
          id?: string
          metodo?: string
          observacao?: string | null
          protocolo?: string | null
          receptora_id?: string | null
          resultado?: string | null
          sangue_previsto?: string | null
          semen_partida?: string | null
          semen_sexado?: string | null
          sexo_feto?: string | null
          tecnico?: string | null
          touro_nome?: string | null
          touro_rgd?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reproducoes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reproducoes_receptora_id_fkey"
            columns: ["receptora_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      secagens: {
        Row: {
          animal_id: string
          created_at: string
          data_secagem: string
          data_ultima_ordenha: string | null
          id: string
          tratamento: string | null
        }
        Insert: {
          animal_id: string
          created_at?: string
          data_secagem: string
          data_ultima_ordenha?: string | null
          id?: string
          tratamento?: string | null
        }
        Update: {
          animal_id?: string
          created_at?: string
          data_secagem?: string
          data_ultima_ordenha?: string | null
          id?: string
          tratamento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "secagens_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      silos: {
        Row: {
          created_at: string
          data_corte: string | null
          id: string
          identificacao: string
          tonelagem_atual: number | null
          tonelagem_inicial: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          data_corte?: string | null
          id?: string
          identificacao: string
          tonelagem_atual?: number | null
          tonelagem_inicial?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          data_corte?: string | null
          id?: string
          identificacao?: string
          tonelagem_atual?: number | null
          tonelagem_inicial?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          colaborador_id: string | null
          created_at: string
          descricao: string | null
          id: string
          modulo_relacionado: string | null
          motivo_nao_realizada: string | null
          prazo: string | null
          prioridade: string | null
          status: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          modulo_relacionado?: string | null
          motivo_nao_realizada?: string | null
          prazo?: string | null
          prioridade?: string | null
          status?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          descricao?: string | null
          id?: string
          modulo_relacionado?: string | null
          motivo_nao_realizada?: string | null
          prazo?: string | null
          prioridade?: string | null
          status?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      transacoes_animais: {
        Row: {
          animais_ids: string[] | null
          contraparte: string | null
          created_at: string
          data: string
          data_exata: boolean
          evento: string | null
          gta_numero: string | null
          id: string
          observacao: string | null
          percentual_mirai: number | null
          peso_kg: number | null
          texto_original: string | null
          tipo: string
          updated_at: string
          valor_arroba: number | null
          valor_total: number | null
        }
        Insert: {
          animais_ids?: string[] | null
          contraparte?: string | null
          created_at?: string
          data: string
          data_exata?: boolean
          evento?: string | null
          gta_numero?: string | null
          id?: string
          observacao?: string | null
          percentual_mirai?: number | null
          peso_kg?: number | null
          texto_original?: string | null
          tipo: string
          updated_at?: string
          valor_arroba?: number | null
          valor_total?: number | null
        }
        Update: {
          animais_ids?: string[] | null
          contraparte?: string | null
          created_at?: string
          data?: string
          data_exata?: boolean
          evento?: string | null
          gta_numero?: string | null
          id?: string
          observacao?: string | null
          percentual_mirai?: number | null
          peso_kg?: number | null
          texto_original?: string | null
          tipo?: string
          updated_at?: string
          valor_arroba?: number | null
          valor_total?: number | null
        }
        Relationships: []
      }
      tratamento_medicamentos: {
        Row: {
          created_at: string
          dose: string | null
          frequencia: string | null
          id: string
          medicamento_id: string | null
          tratamento_id: string
          via: string | null
        }
        Insert: {
          created_at?: string
          dose?: string | null
          frequencia?: string | null
          id?: string
          medicamento_id?: string | null
          tratamento_id: string
          via?: string | null
        }
        Update: {
          created_at?: string
          dose?: string | null
          frequencia?: string | null
          id?: string
          medicamento_id?: string | null
          tratamento_id?: string
          via?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tratamento_medicamentos_medicamento_id_fkey"
            columns: ["medicamento_id"]
            isOneToOne: false
            referencedRelation: "medicamentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tratamento_medicamentos_tratamento_id_fkey"
            columns: ["tratamento_id"]
            isOneToOne: false
            referencedRelation: "tratamentos"
            referencedColumns: ["id"]
          },
        ]
      }
      tratamentos: {
        Row: {
          animal_id: string
          created_at: string
          data_fim: string | null
          data_inicio: string
          desfecho: string | null
          diagnostico: string | null
          id: string
          responsavel: string | null
          updated_at: string
        }
        Insert: {
          animal_id: string
          created_at?: string
          data_fim?: string | null
          data_inicio: string
          desfecho?: string | null
          diagnostico?: string | null
          id?: string
          responsavel?: string | null
          updated_at?: string
        }
        Update: {
          animal_id?: string
          created_at?: string
          data_fim?: string | null
          data_inicio?: string
          desfecho?: string | null
          diagnostico?: string | null
          id?: string
          responsavel?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tratamentos_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vacinacoes: {
        Row: {
          animal_id: string
          campanha_id: string | null
          created_at: string
          data: string
          id: string
          lote: string | null
          observacao: string | null
          proxima_dose: string | null
          responsavel: string | null
          vacina_id: string | null
        }
        Insert: {
          animal_id: string
          campanha_id?: string | null
          created_at?: string
          data: string
          id?: string
          lote?: string | null
          observacao?: string | null
          proxima_dose?: string | null
          responsavel?: string | null
          vacina_id?: string | null
        }
        Update: {
          animal_id?: string
          campanha_id?: string | null
          created_at?: string
          data?: string
          id?: string
          lote?: string | null
          observacao?: string | null
          proxima_dose?: string | null
          responsavel?: string | null
          vacina_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vacinacoes_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vacinacoes_vacina_id_fkey"
            columns: ["vacina_id"]
            isOneToOne: false
            referencedRelation: "vacinas"
            referencedColumns: ["id"]
          },
        ]
      }
      vacinas: {
        Row: {
          created_at: string
          custo: number | null
          doses: number | null
          fabricante: string | null
          id: string
          lote: string | null
          nome: string
          temp_armazenamento: string | null
          updated_at: string
          validade: string | null
        }
        Insert: {
          created_at?: string
          custo?: number | null
          doses?: number | null
          fabricante?: string | null
          id?: string
          lote?: string | null
          nome: string
          temp_armazenamento?: string | null
          updated_at?: string
          validade?: string | null
        }
        Update: {
          created_at?: string
          custo?: number | null
          doses?: number | null
          fabricante?: string | null
          id?: string
          lote?: string | null
          nome?: string
          temp_armazenamento?: string | null
          updated_at?: string
          validade?: string | null
        }
        Relationships: []
      }
      vales_leite: {
        Row: {
          cbt: number | null
          ccs: number | null
          created_at: string
          data: string
          gordura: number | null
          id: string
          litros: number
          observacao: string | null
          proteina: number | null
        }
        Insert: {
          cbt?: number | null
          ccs?: number | null
          created_at?: string
          data: string
          gordura?: number | null
          id?: string
          litros: number
          observacao?: string | null
          proteina?: number | null
        }
        Update: {
          cbt?: number | null
          ccs?: number | null
          created_at?: string
          data?: string
          gordura?: number | null
          id?: string
          litros?: number
          observacao?: string | null
          proteina?: number | null
        }
        Relationships: []
      }
      venda_carne: {
        Row: {
          cliente: string | null
          created_at: string
          data: string | null
          forma_pagamento: string | null
          id: string
          observacao: string | null
          peso_arroba: number | null
          receptora: string | null
          valor: number
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          data?: string | null
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          peso_arroba?: number | null
          receptora?: string | null
          valor: number
        }
        Update: {
          cliente?: string | null
          created_at?: string
          data?: string | null
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          peso_arroba?: number | null
          receptora?: string | null
          valor?: number
        }
        Relationships: []
      }
      venda_granel: {
        Row: {
          comprador: string
          created_at: string
          data: string
          id: string
          litros: number
          preco_litro: number
          status_pagamento: string | null
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          comprador: string
          created_at?: string
          data: string
          id?: string
          litros: number
          preco_litro: number
          status_pagamento?: string | null
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          comprador?: string
          created_at?: string
          data?: string
          id?: string
          litros?: number
          preco_litro?: number
          status_pagamento?: string | null
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      venda_silo: {
        Row: {
          comprador: string
          created_at: string
          data: string
          id: string
          preco_ton: number | null
          status_pagamento: string | null
          tonelagem: number
          updated_at: string
        }
        Insert: {
          comprador: string
          created_at?: string
          data: string
          id?: string
          preco_ton?: number | null
          status_pagamento?: string | null
          tonelagem: number
          updated_at?: string
        }
        Update: {
          comprador?: string
          created_at?: string
          data?: string
          id?: string
          preco_ton?: number | null
          status_pagamento?: string | null
          tonelagem?: number
          updated_at?: string
        }
        Relationships: []
      }
      vendas_avulsas: {
        Row: {
          comprador: string | null
          created_at: string
          data: string
          forma_pagamento: string | null
          id: string
          observacao: string | null
          preco_unitario: number | null
          quantidade: number
          registrado_por: string | null
          tipo: string
          unidade: string
          updated_at: string
          valor_total: number | null
        }
        Insert: {
          comprador?: string | null
          created_at?: string
          data?: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          preco_unitario?: number | null
          quantidade: number
          registrado_por?: string | null
          tipo: string
          unidade?: string
          updated_at?: string
          valor_total?: number | null
        }
        Update: {
          comprador?: string | null
          created_at?: string
          data?: string
          forma_pagamento?: string | null
          id?: string
          observacao?: string | null
          preco_unitario?: number | null
          quantidade?: number
          registrado_por?: string | null
          tipo?: string
          unidade?: string
          updated_at?: string
          valor_total?: number | null
        }
        Relationships: []
      }
      vendas_genetica: {
        Row: {
          animal_id: string
          comprador: string | null
          created_at: string
          data: string
          id: string
          observacao: string | null
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          animal_id: string
          comprador?: string | null
          created_at?: string
          data?: string
          id?: string
          observacao?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Update: {
          animal_id?: string
          comprador?: string | null
          created_at?: string
          data?: string
          id?: string
          observacao?: string | null
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "vendas_genetica_animal_id_fkey"
            columns: ["animal_id"]
            isOneToOne: false
            referencedRelation: "animais"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_gestor_or_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "gestor" | "colaborador" | "administrador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["gestor", "colaborador", "administrador"],
    },
  },
} as const
