with source as (
    select * from {{ ref('wid_metadata_clean') }}
),

renamed as (
    select
        variable_code,
        category,
        type,
        region
    from source
)

select * from renamed
