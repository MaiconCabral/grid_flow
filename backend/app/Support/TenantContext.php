<?php

namespace App\Support;

class TenantContext
{
    private ?int $id = null;

    public function set(?int $id): void
    {
        $this->id = $id;
    }

    public function id(): ?int
    {
        return $this->id;
    }

    public function forget(): void
    {
        $this->id = null;
    }
}
