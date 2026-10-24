<?php

namespace App\Models;

use Spatie\Permission\Traits\HasRoles;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property string $name
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property string $password
 * @property string|null $two_factor_secret
 * @property string|null $two_factor_recovery_codes
 * @property Carbon|null $two_factor_confirmed_at
 * @property bool $is_active
 * @property int $vacation_days_total
 * @property int $vacation_days_used
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'name',
    'email',
    'password',
    'is_active',
    'vacation_days_total',
    'vacation_days_used',
])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable, HasRoles;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_confirmed_at' => 'datetime',
            'is_active' => 'boolean',
            'vacation_days_total' => 'integer',
            'vacation_days_used' => 'integer',
        ];
    }

    /**
     * Relación: ausencias del empleado.
     */
    public function absences()
    {
        return $this->hasMany(EmployeeAbsence::class);
    }

    /**
     * Relación: servicios asignados a este empleado.
     */
    public function serviceAssignments()
    {
        return $this->hasMany(ServiceAssignment::class);
    }

    /**
     * Relación: servicios en los que participa.
     */
    public function assignedServices()
    {
        return $this->belongsToMany(Service::class, 'service_assignments')
            ->withPivot(['role_in_service', 'notes', 'assigned_at'])
            ->withTimestamps();
    }

    /**
     * Accessor: días de vacaciones disponibles.
     */
    public function getVacationDaysAvailableAttribute(): int
    {
        return max(0, $this->vacation_days_total - $this->vacation_days_used);
    }
}