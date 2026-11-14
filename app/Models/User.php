<?php

namespace App\Models;

use Spatie\Permission\Traits\HasRoles;
use Database\Factories\UserFactory;
// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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
 * @property int $failed_login_attempts
 * @property Carbon|null $locked_until
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
    'failed_login_attempts',
    'locked_until',
])]
#[Hidden(['password', 'two_factor_secret', 'two_factor_recovery_codes', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, Notifiable, PasskeyAuthenticatable, TwoFactorAuthenticatable, HasRoles;

    /**
     * Eventos del modelo.
     */
    protected static function booted(): void
    {
        // Invalidar sesiones cuando el usuario es desactivado
        static::updated(function (User $user) {
            if ($user->wasChanged('is_active') && ! $user->is_active) {
                // Invalidar sesiones activas
                DB::table('sessions')->where('user_id', $user->id)->delete();

                // Invalidar tokens de Sanctum (si los usa)
                if (method_exists($user, 'tokens')) {
                    $user->tokens()->delete();
                }
            }
        });
    }

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
            'failed_login_attempts' => 'integer',
            'locked_until' => 'datetime',
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
     * Relación: cliente asociado a este usuario (inversa de Client::user()).
     */
    public function client()
    {
        return $this->hasOne(Client::class);
    }

    /**
     * Relación: registro de chofer asociado a este usuario.
     */
    public function driver()
    {
        return $this->hasOne(Driver::class);
    }

    /**
     * Accessor: días de vacaciones disponibles.
     */
    public function getVacationDaysAvailableAttribute(): int
    {
        return max(0, $this->vacation_days_total - $this->vacation_days_used);
    }

    /**
     * Accessor: ¿la cuenta está actualmente bloqueada?
     */
    public function getIsLockedAttribute(): bool
    {
        return $this->locked_until && $this->locked_until->isFuture();
    }
}