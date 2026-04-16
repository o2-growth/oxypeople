UPDATE public.pipefy_sync_config 
SET field_mapping = jsonb_set(field_mapping, '{email}', '"E-mail O2"'),
    updated_at = now();